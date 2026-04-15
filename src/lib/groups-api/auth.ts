import { createMiddleware } from "hono/factory";
import { db } from "#/db";
import { oauthAccessToken } from "#/db/schema";
import { eq } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

type TokenRecord = InferSelectModel<typeof oauthAccessToken>;

export type AuthEnv = {
	Variables: {
		token: TokenRecord;
	};
};

async function hashToken(token: string): Promise<string> {
	const data = new TextEncoder().encode(token);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const bytes = new Uint8Array(hashBuffer);
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export const requireToken = createMiddleware<AuthEnv>(async (c, next) => {
	const authHeader = c.req.header("Authorization");
	const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
	if (!bearer) return c.json({ error: "unauthorized" }, 401);

	const hashedBearer = await hashToken(bearer);
	const tokenRecord = await db.select().from(oauthAccessToken).where(eq(oauthAccessToken.token, hashedBearer)).get();

	if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
		return c.json({ error: "unauthorized" }, 401);
	}

	c.set("token", tokenRecord);
	await next();
});

export const requireUserToken = createMiddleware<AuthEnv>(async (c, next) => {
	const token = c.get("token");
	if (!token?.userId) return c.json({ error: "unauthorized" }, 401);
	await next();
});

export const requireSystemScope = createMiddleware<AuthEnv>(async (c, next) => {
	const token = c.get("token");
	const scopes: string[] = typeof token.scopes === "string" ? JSON.parse(token.scopes) : (token.scopes ?? []);
	if (!scopes.includes("system-all-users")) {
		return c.json({ error: "insufficient_scope" }, 403);
	}
	await next();
});
