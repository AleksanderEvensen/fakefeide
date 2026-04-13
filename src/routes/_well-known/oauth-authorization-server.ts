import { createFileRoute } from "@tanstack/react-router";
import { oauthProviderAuthServerMetadata } from "@better-auth/oauth-provider";
import { auth } from "#/lib/auth";
import { oauthMetadataSchema, rewriteMetadataUrls } from "#/lib/well-known";

const handler = oauthProviderAuthServerMetadata(auth);

export const Route = createFileRoute("/.well-known/oauth-authorization-server")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const response = await handler(request);
				const metadata = oauthMetadataSchema.parse(await response.json());
				const rewritten = rewriteMetadataUrls(request, metadata);
				return new Response(JSON.stringify(rewritten), {
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
