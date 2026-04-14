import { createFileRoute } from "@tanstack/react-router";
import { oauthProviderAuthServerMetadata } from "@better-auth/oauth-provider";
import { auth } from "#/lib/auth";

const handler = oauthProviderAuthServerMetadata(auth);

export const Route = createFileRoute("/.well-known/oauth-authorization-server")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const response = await handler(request);
				return new Response(response.body, {
					status: response.status,
					headers: {
						"Content-Type": "application/json",
						"Access-Control-Allow-Methods": "GET",
						"Access-Control-Allow-Origin": "*",
					},
				});
			},
		},
	},
});
