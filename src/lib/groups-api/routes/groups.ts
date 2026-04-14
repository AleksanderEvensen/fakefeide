import { Hono } from "hono";
import { db } from "#/db";
import { groups, groupMemberships, user } from "#/db/schema";
import { eq, and, like } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { type AuthEnv, requireToken } from "../auth";
import { formatGroup, formatMembership } from "../format";

/** Escape special characters for use inside a SQL LIKE pattern. */
function escapeLike(value: string): string {
	return value.replace(/[%_\\]/g, (ch) => `\\${ch}`);
}

const app = new Hono<AuthEnv>();

app.use(requireToken);

app.get("/", async (c) => {
	const token = c.get("token");
	const goType = c.req.query("go_type");
	const grepCode = c.req.query("grep_code");
	const orgunit = c.req.query("orgunit");
	const showAll = c.req.query("showAll") === "true";

	const hasFilters = goType || grepCode || orgunit;

	if (!hasFilters && token.userId) {
		const rows = await db
			.select({ group: groups })
			.from(groupMemberships)
			.innerJoin(groups, eq(groupMemberships.groupId, groups.id))
			.where(eq(groupMemberships.userId, token.userId))
			.all();

		return c.json(rows.map((r) => formatGroup(r.group)));
	}

	const conditions: SQL[] = [];
	if (goType) conditions.push(like(groups.extra, `%"go_type":"${escapeLike(goType)}"%`));
	if (grepCode) conditions.push(like(groups.extra, `%"code":"${escapeLike(grepCode)}"%`));
	if (orgunit) {
		// The orgunit param may be a raw group ID, or prefixed with NO (org number)
		// or U (unit code). Translate prefixes to the matching parentId pattern.
		if (orgunit.startsWith("NO")) {
			// Match any parent whose ID contains the org number as a unit suffix
			conditions.push(like(groups.parentId, `%:unit:${escapeLike(orgunit)}%`));
		} else if (orgunit.startsWith("U")) {
			conditions.push(like(groups.parentId, `%:unit:${escapeLike(orgunit.slice(1))}%`));
		} else {
			conditions.push(eq(groups.parentId, orgunit));
		}
	}

	const rows = await db
		.select()
		.from(groups)
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.all();

	const now = new Date().toISOString();
	const filtered = showAll ? rows : rows.filter((r) => !r.notAfter || r.notAfter >= now);

	return c.json(filtered.map(formatGroup));
});

app.get("/:groupId{.+}/members", async (c) => {
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

app.get("/:groupId{.+}", async (c) => {
	const groupId = decodeURIComponent(c.req.param("groupId"));

	const row = await db.select().from(groups).where(eq(groups.id, groupId)).get();
	if (!row) return c.json({ error: "not_found" }, 404);

	return c.json(formatGroup(row));
});

export default app;
