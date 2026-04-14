import type { InferSelectModel } from "drizzle-orm";
import type { groups, groupMemberships } from "#/db/schema";

type GroupRow = InferSelectModel<typeof groups>;
type MembershipRow = InferSelectModel<typeof groupMemberships>;

export function formatGroup(row: GroupRow) {
	const parsed = row.extra ? JSON.parse(row.extra) : {};
	const result: Record<string, unknown> = {
		id: row.id,
		type: row.type,
		displayName: row.displayName,
		public: row.public ?? false,
		...parsed,
	};
	if (row.parentId) result.parent = row.parentId;
	if (row.notBefore) result.notBefore = row.notBefore;
	if (row.notAfter) result.notAfter = row.notAfter;
	return result;
}

export function formatMembership(row: MembershipRow) {
	const parsed = row.extra ? JSON.parse(row.extra) : {};
	return { basic: row.basic, ...parsed };
}
