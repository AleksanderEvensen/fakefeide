import { Hono } from "hono";
import { db } from "#/db";
import { groups, groupMemberships, user } from "#/db/schema";
import { eq, inArray } from "drizzle-orm";
import { type AuthEnv, requireToken, requireSystemScope } from "../auth";
import { formatGroup, formatMembership } from "../format";

const app = new Hono<AuthEnv>();

app.use(requireToken, requireSystemScope);

app.get("/:domain/groups", async (c) => {
	const domain = c.req.param("domain");
	const perPage = Math.min(Number.parseInt(c.req.query("per_page") || "100", 10), 1000);
	const cursor = c.req.query("cursor");
	const goType = c.req.query("go_type");

	const orgId = `fc:org:${domain}`;

	// 2-level child lookup
	const directChildren = await db
		.select()
		.from(groups)
		.where(eq(groups.parentId, orgId))
		.all();

	const directChildIds = directChildren.map((g) => g.id);

	let grandChildren: typeof directChildren = [];
	if (directChildIds.length > 0) {
		grandChildren = await db
			.select()
			.from(groups)
			.where(inArray(groups.parentId, directChildIds))
			.all();
	}

	let allGroups = [...directChildren, ...grandChildren];

	if (goType) {
		allGroups = allGroups.filter((g) => {
			if (!g.extra) return false;
			try {
				return JSON.parse(g.extra).go_type === goType;
			} catch {
				return false;
			}
		});
	}

	allGroups.sort((a, b) => a.id.localeCompare(b.id));

	if (cursor) {
		const idx = allGroups.findIndex((g) => g.id === cursor);
		if (idx >= 0) allGroups = allGroups.slice(idx + 1);
	}

	const page = allGroups.slice(0, perPage);
	const hasMore = allGroups.length > perPage;

	if (hasMore && page.length > 0) {
		const nextCursor = page[page.length - 1].id;
		const nextUrl = new URL(c.req.url);
		nextUrl.searchParams.set("cursor", nextCursor);
		c.header("Link", `<${nextUrl.toString()}>; rel="next"`);
	}

	return c.json(page.map(formatGroup));
});

app.get("/:domain/groups/:groupId{.+}/members", async (c) => {
	const groupId = decodeURIComponent(c.req.param("groupId"));
	const affiliationFilter = c.req.query("affiliation");

	const rows = await db
		.select({ user, membership: groupMemberships })
		.from(groupMemberships)
		.innerJoin(user, eq(groupMemberships.userId, user.id))
		.where(eq(groupMemberships.groupId, groupId))
		.all();

	let result = rows.map((r) => ({
		name: r.user.name,
		userid_sec: [`feide:${r.user.email}`],
		membership: formatMembership(r.membership),
	}));

	if (affiliationFilter) {
		result = result.filter((r) => {
			const aff = r.membership.affiliation;
			if (Array.isArray(aff)) return aff.includes(affiliationFilter);
			return aff === affiliationFilter;
		});
	}

	return c.json(result);
});

app.get("/:domain/groups/:groupId{.+}", async (c) => {
	const domain = c.req.param("domain");
	const groupId = decodeURIComponent(c.req.param("groupId"));
	const orgId = `fc:org:${domain}`;

	const row = await db.select().from(groups).where(eq(groups.id, groupId)).get();
	if (!row) return c.json({ error: "not_found" }, 404);

	// Verify group belongs to org (up to 2 levels)
	let belongs = row.parentId === orgId;
	if (!belongs && row.parentId) {
		const parent = await db.select().from(groups).where(eq(groups.id, row.parentId)).get();
		belongs = parent?.parentId === orgId;
	}
	if (!belongs) return c.json({ error: "not_found" }, 404);

	return c.json(formatGroup(row));
});

export default app;
