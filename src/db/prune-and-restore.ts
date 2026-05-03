import { readFileSync } from "node:fs";
import { db } from "#/db";
import * as schema from "./schema.ts";

const {
	groupMemberships,
	groups,
	todos,
	oauthAccessToken,
	oauthRefreshToken,
	oauthConsent,
	oauthClient,
	session,
	account,
	verification,
	jwks,
	user,
} = schema;

type OauthClientRow = typeof oauthClient.$inferInsert;

function normalizeClient(raw: Record<string, unknown>): OauthClientRow {
	const parseJsonField = (v: unknown) => {
		if (v == null) return v;
		if (typeof v === "string") {
			try {
				return JSON.parse(v);
			} catch {
				return v;
			}
		}
		return v;
	};

	const parseDate = (v: unknown) => (typeof v === "string" ? new Date(v) : v);

	return {
		...raw,
		scopes: parseJsonField(raw.scopes),
		grantTypes: parseJsonField(raw.grantTypes),
		responseTypes: parseJsonField(raw.responseTypes),
		redirectUris: parseJsonField(raw.redirectUris),
		postLogoutRedirectUris: parseJsonField(raw.postLogoutRedirectUris),
		contacts: parseJsonField(raw.contacts),
		metadata: parseJsonField(raw.metadata),
		createdAt: parseDate(raw.createdAt),
		updatedAt: parseDate(raw.updatedAt),
	} as OauthClientRow;
}

async function run() {
	console.log("Pruning database...");

	// Order matters for FK constraints
	await db.delete(groupMemberships);
	await db.delete(groups);
	await db.delete(todos);
	await db.delete(oauthAccessToken);
	await db.delete(oauthRefreshToken);
	await db.delete(oauthConsent);
	await db.delete(oauthClient);
	await db.delete(session);
	await db.delete(account);
	await db.delete(verification);
	await db.delete(jwks);
	await db.delete(user);

	console.log("  Database pruned.");

	console.log("Restoring OAuth clients from backup...");
	const raw = readFileSync("oauth-clients-backup.json", "utf8");
	const clients = JSON.parse(raw) as Record<string, unknown>[];
	for (const c of clients) {
		await db.insert(oauthClient).values(normalizeClient(c));
	}
	console.log(`  Restored ${clients.length} oauth client(s).`);
}

run().catch((err) => {
	console.error("Prune & restore failed:", err);
	process.exit(1);
});
