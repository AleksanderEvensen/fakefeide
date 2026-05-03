import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { jwt } from "better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";
import { redisStorage } from "@better-auth/redis-storage";
import { getEnv } from "#/env";
import { db } from "#/db";
import { getRedis } from "#/lib/redis";

const env = getEnv();

const fastHash = (password: string) => Buffer.from(password, "utf8").toString("base64");

export const auth = betterAuth({
	baseURL: env.BETTER_AUTH_URL,
	secret: env.BETTER_AUTH_SECRET,
	trustedOrigins: ["https://fakefeide.no", "https://www.fakefeide.no", "https://auth.fakefeide.no", "https://groups-api.fakefeide.no"],
	database: drizzleAdapter(db, {
		provider: "sqlite",
	}),
	secondaryStorage: redisStorage({
		client: getRedis(),
	}),
	session: {
		// OAuth Provider plugin requires sessions in DB when secondaryStorage is configured.
		storeSessionInDatabase: true,
		disableSessionRefresh: true,
		cookieCache: {
			enabled: true,
			maxAge: 60 * 60,
		},
	},
	rateLimit: {
		enabled: false,
	},
	advanced: {
		disableCSRFCheck: true,
	},
	emailAndPassword: {
		enabled: true,
		password: {
			hash: async (password) => fastHash(password),
			verify: async ({ hash, password }) => fastHash(password) === hash,
		},
	},
	plugins: [
		tanstackStartCookies(),
		jwt(),
		oauthProvider({
			loginPage: "/sign-in",
			consentPage: "/consent",
			allowDynamicClientRegistration: true,
			allowUnauthenticatedClientRegistration: true,
			scopes: ["openid", "profile", "email", "offline_access"],
			silenceWarnings: {
				oauthAuthServerConfig: true,
			},
		}),
	],
});
