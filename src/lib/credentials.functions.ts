import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { db } from "#/db";
import { oauthClient, oauthConsent, user } from "#/db/schema";
import { getEnv } from "#/env";
import {
	clearAdminCookie,
	isAdminAuthenticated,
	parseRedirectUris,
	randomId,
	requireAdmin,
	setAdminCookie,
	timingSafeEqual,
} from "#/lib/credentials.server";

export type AdminClient = {
	id: string;
	clientId: string;
	clientSecret: string | null;
	name: string | null;
	uri: string | null;
	disabled: boolean;
	skipConsent: boolean;
	redirectUris: string[];
	postLogoutRedirectUris: string[];
	public: boolean;
	createdAt: Date | null;
};

export type ClientConsent = {
	id: string;
	userId: string | null;
	userName: string | null;
	userEmail: string | null;
	scopes: string[];
	createdAt: Date;
	updatedAt: Date;
};

export const getAdminSession = createServerFn({ method: "GET" }).handler(async () => {
	return { authenticated: isAdminAuthenticated() };
});

export const adminLogin = createServerFn({ method: "POST" })
	.inputValidator((data: { password: string }) => data)
	.handler(async ({ data }) => {
		const env = getEnv();
		if (!env.ADMIN_PASSWORD) {
			throw new Error("ADMIN_PASSWORD is not configured");
		}
		if (!data.password || !timingSafeEqual(data.password, env.ADMIN_PASSWORD)) {
			throw new Error("Invalid password");
		}
		setAdminCookie(env.ADMIN_PASSWORD);
		return { ok: true };
	});

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
	clearAdminCookie();
	return { ok: true };
});

function coerceStringArray(value: unknown): string[] {
	if (Array.isArray(value)) return value.filter((v) => typeof v === "string");
	if (typeof value === "string") {
		try {
			const parsed = JSON.parse(value);
			if (Array.isArray(parsed)) return parsed.filter((v) => typeof v === "string");
		} catch {
			// not JSON — ignore
		}
	}
	return [];
}

export const listClients = createServerFn({ method: "GET" }).handler(async (): Promise<AdminClient[]> => {
	requireAdmin();
	const rows = await db.select().from(oauthClient).orderBy(desc(oauthClient.createdAt));
	return rows.map((r) => ({
		id: r.id,
		clientId: r.clientId,
		clientSecret: r.clientSecret ?? null,
		name: r.name ?? null,
		uri: r.uri ?? null,
		disabled: !!r.disabled,
		skipConsent: !!r.skipConsent,
		redirectUris: coerceStringArray(r.redirectUris),
		postLogoutRedirectUris: coerceStringArray(r.postLogoutRedirectUris),
		public: !!r.public,
		createdAt: r.createdAt ?? null,
	}));
});

export const createClient = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			name: string;
			uri?: string;
			redirectUris: string[];
			postLogoutRedirectUris?: string[];
			skipConsent?: boolean;
			public?: boolean;
		}) => data,
	)
	.handler(async ({ data }) => {
		requireAdmin();
		const name = data.name.trim();
		if (!name) throw new Error("Name is required");
		const redirectUris = parseRedirectUris(data.redirectUris);
		if (redirectUris.length === 0) throw new Error("At least one valid redirect URI is required");
		const postLogoutRedirectUris = parseRedirectUris(data.postLogoutRedirectUris ?? []);

		const id = randomId(16);
		const clientId = randomId(24);
		const isPublic = !!data.public;
		const clientSecret = isPublic ? null : randomId(32);
		const now = new Date();

		await db.insert(oauthClient).values({
			id,
			clientId,
			clientSecret,
			name,
			uri: data.uri?.trim() || null,
			redirectUris: redirectUris as never,
			postLogoutRedirectUris: postLogoutRedirectUris as never,
			skipConsent: !!data.skipConsent,
			public: isPublic,
			tokenEndpointAuthMethod: isPublic ? "none" : "client_secret_basic",
			grantTypes: ["authorization_code", "refresh_token"] as never,
			responseTypes: ["code"] as never,
			createdAt: now,
			updatedAt: now,
		});

		return { id, clientId, clientSecret };
	});

export const updateClient = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			id: string;
			name?: string;
			uri?: string;
			redirectUris?: string[];
			postLogoutRedirectUris?: string[];
			skipConsent?: boolean;
			disabled?: boolean;
		}) => data,
	)
	.handler(async ({ data }) => {
		requireAdmin();

		const existing = await db.select().from(oauthClient).where(eq(oauthClient.id, data.id)).get();
		if (!existing) throw new Error("Client not found");

		const patch: Record<string, unknown> = { updatedAt: new Date() };
		if (typeof data.name === "string") patch.name = data.name.trim();
		if (typeof data.uri === "string") patch.uri = data.uri.trim() || null;
		if (typeof data.skipConsent === "boolean") patch.skipConsent = data.skipConsent;
		if (typeof data.disabled === "boolean") patch.disabled = data.disabled;
		if (Array.isArray(data.redirectUris)) {
			const uris = parseRedirectUris(data.redirectUris);
			if (uris.length === 0) throw new Error("At least one valid redirect URI is required");
			patch.redirectUris = uris;
		}
		if (Array.isArray(data.postLogoutRedirectUris)) {
			patch.postLogoutRedirectUris = parseRedirectUris(data.postLogoutRedirectUris);
		}

		await db.update(oauthClient).set(patch).where(eq(oauthClient.id, data.id));
		return { ok: true };
	});

export const deleteClient = createServerFn({ method: "POST" })
	.inputValidator((data: { id: string }) => data)
	.handler(async ({ data }) => {
		requireAdmin();
		await db.delete(oauthClient).where(eq(oauthClient.id, data.id));
		return { ok: true };
	});

export const listClientConsents = createServerFn({ method: "GET" })
	.inputValidator((data: { clientId: string }) => data)
	.handler(async ({ data }): Promise<ClientConsent[]> => {
		requireAdmin();
		const rows = await db
			.select({
				id: oauthConsent.id,
				userId: oauthConsent.userId,
				scopes: oauthConsent.scopes,
				createdAt: oauthConsent.createdAt,
				updatedAt: oauthConsent.updatedAt,
				userName: user.name,
				userEmail: user.email,
			})
			.from(oauthConsent)
			.leftJoin(user, eq(oauthConsent.userId, user.id))
			.where(eq(oauthConsent.clientId, data.clientId))
			.orderBy(desc(oauthConsent.createdAt));
		return rows.map((r) => ({
			id: r.id,
			userId: r.userId ?? null,
			userName: r.userName ?? null,
			userEmail: r.userEmail ?? null,
			scopes: coerceStringArray(r.scopes),
			createdAt: r.createdAt,
			updatedAt: r.updatedAt,
		}));
	});

export const deleteClientConsent = createServerFn({ method: "POST" })
	.inputValidator((data: { id: string }) => data)
	.handler(async ({ data }) => {
		requireAdmin();
		await db.delete(oauthConsent).where(eq(oauthConsent.id, data.id));
		return { ok: true };
	});

export const updateClientConsent = createServerFn({ method: "POST" })
	.inputValidator((data: { id: string; scopes: string[] }) => data)
	.handler(async ({ data }) => {
		requireAdmin();
		const scopes = (Array.isArray(data.scopes) ? data.scopes : [])
			.filter((s): s is string => typeof s === "string")
			.map((s) => s.trim())
			.filter(Boolean);
		await db
			.update(oauthConsent)
			.set({ scopes: scopes as never, updatedAt: new Date() })
			.where(eq(oauthConsent.id, data.id));
		return { ok: true };
	});
