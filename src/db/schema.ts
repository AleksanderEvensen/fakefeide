import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
import {
	user,
	session,
	account,
	oauthClient,
	oauthRefreshToken,
	oauthAccessToken,
	oauthConsent,
} from "./auth-schema.ts";

export * from "./auth-schema.ts";

// ── App-specific tables ──────────────────────────────────────────────

export const todos = sqliteTable("todos", {
	id: integer({ mode: "number" }).primaryKey({
		autoIncrement: true,
	}),
	title: text().notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// ── Groups & Memberships ─────────────────────────────────────────────

export const groups = sqliteTable("groups", {
	id: text("id").primaryKey(),
	type: text("type").notNull(),
	displayName: text("display_name").notNull(),
	parentId: text("parent_id").references((): any => groups.id),
	public: integer("public", { mode: "boolean" }).default(false),
	notBefore: text("not_before"),
	notAfter: text("not_after"),
	extra: text("extra"),
	createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const groupMemberships = sqliteTable(
	"group_memberships",
	{
		id: integer({ mode: "number" }).primaryKey({
			autoIncrement: true,
		}),
		groupId: text("group_id")
			.notNull()
			.references(() => groups.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		basic: text("basic").notNull(),
		extra: text("extra"),
		createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
	},
	(table) => [
		index("group_memberships_groupId_idx").on(table.groupId),
		index("group_memberships_userId_idx").on(table.userId),
	],
);

// ── Groups relations ─────────────────────────────────────────────────

export const groupsRelations = relations(groups, ({ one, many }) => ({
	parent: one(groups, {
		fields: [groups.parentId],
		references: [groups.id],
	}),
	groupMemberships: many(groupMemberships),
}));

export const groupMembershipsRelations = relations(groupMemberships, ({ one }) => ({
	group: one(groups, {
		fields: [groupMemberships.groupId],
		references: [groups.id],
	}),
	user: one(user, {
		fields: [groupMemberships.userId],
		references: [user.id],
	}),
}));

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	oauthClients: many(oauthClient),
	oauthRefreshTokens: many(oauthRefreshToken),
	oauthAccessTokens: many(oauthAccessToken),
	oauthConsents: many(oauthConsent),
	groupMemberships: many(groupMemberships),
}));
