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
		storeSessionInDatabase: true,
		disableSessionRefresh: true,
		cookieCache: {
			enabled: true,
			maxAge: 10 * 60,
		},
	},
	emailAndPassword: {
		enabled: true,
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
