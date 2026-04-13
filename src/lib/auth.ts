import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { jwt } from "better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";
import { getEnv } from "#/env";
import { db } from "#/db";

const env = getEnv();

export const auth = betterAuth({
	baseURL: env.BETTER_AUTH_URL,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, {
		provider: "sqlite",
	}),
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
