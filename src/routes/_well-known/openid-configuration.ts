import { createFileRoute } from "@tanstack/react-router";
import { oauthProviderOpenIdConfigMetadata } from "@better-auth/oauth-provider";
import { auth } from "#/lib/auth";

const handler = oauthProviderOpenIdConfigMetadata(auth);

export const Route = createFileRoute("/.well-known/openid-configuration")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const response = await handler(request);
				response.headers.set("Access-Control-Allow-Methods", "GET");
				response.headers.set("Access-Control-Allow-Origin", "*");
				return response;
			},
		},
	},
});
