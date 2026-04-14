import { Hono } from "hono";
import { db } from "#/db";
import { groups, groupMemberships } from "#/db/schema";
import { eq, and } from "drizzle-orm";
import { type AuthEnv, requireToken, requireUserToken } from "../auth";
import { formatGroup, formatMembership } from "../format";

const app = new Hono<AuthEnv>();

app.use(requireToken, requireUserToken);

app.get("/groups", async (c) => {
	const userId = c.get("token").userId!;

	const rows = await db
		.select({ group: groups, membership: groupMemberships })
		.from(groupMemberships)
		.innerJoin(groups, eq(groupMemberships.groupId, groups.id))
		.where(eq(groupMemberships.userId, userId))
		.all();

	return c.json(
		rows.map((r) => ({
			...formatGroup(r.group),
			membership: formatMembership(r.membership),
		})),
	);
});

app.get("/groups/:groupId{.+}", async (c) => {
	const userId = c.get("token").userId!;
	const groupId = decodeURIComponent(c.req.param("groupId"));

	const row = await db
		.select({ group: groups, membership: groupMemberships })
		.from(groupMemberships)
		.innerJoin(groups, eq(groupMemberships.groupId, groups.id))
		.where(and(eq(groupMemberships.userId, userId), eq(groupMemberships.groupId, groupId)))
		.get();

	if (!row) return c.json({ error: "not_found" }, 404);

	return c.json({
		...formatGroup(row.group),
		membership: formatMembership(row.membership),
	});
});

export default app;
