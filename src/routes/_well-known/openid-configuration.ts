import { createFileRoute } from "@tanstack/react-router";
import { oauthProviderOpenIdConfigMetadata } from "@better-auth/oauth-provider";
import { auth } from "#/lib/auth";
import { oauthMetadataSchema, rewriteMetadataUrls } from "#/lib/well-known";

const handler = oauthProviderOpenIdConfigMetadata(auth);

export const Route = createFileRoute("/.well-known/openid-configuration")({
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
