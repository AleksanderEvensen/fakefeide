import { z } from "zod/v4";
import { getEnv } from "#/env";

export const oauthMetadataSchema = z.object({
	issuer: z.url(),
	authorization_endpoint: z.url(),
	token_endpoint: z.url(),
	jwks_uri: z.url(),
	registration_endpoint: z.url().optional(),
	introspection_endpoint: z.url().optional(),
	revocation_endpoint: z.url().optional(),
	userinfo_endpoint: z.url().optional(),
	end_session_endpoint: z.url().optional(),
	scopes_supported: z.array(z.string()),
	response_types_supported: z.array(z.string()),
	response_modes_supported: z.array(z.string()).optional(),
	grant_types_supported: z.array(z.string()),
	token_endpoint_auth_methods_supported: z.array(z.string()),
	introspection_endpoint_auth_methods_supported: z.array(z.string()).optional(),
	revocation_endpoint_auth_methods_supported: z.array(z.string()).optional(),
	code_challenge_methods_supported: z.array(z.string()).optional(),
	subject_types_supported: z.array(z.string()).optional(),
	id_token_signing_alg_values_supported: z.array(z.string()).optional(),
	claims_supported: z.array(z.string()).optional(),
	prompt_values_supported: z.array(z.string()).optional(),
	authorization_response_iss_parameter_supported: z.boolean().optional(),
});

export type OAuthMetadata = z.infer<typeof oauthMetadataSchema>;

/**
 * When served from the `auth.` subdomain, rewrites all endpoint URLs
 * in OIDC/OAuth metadata to strip the `/api/auth` base path.
 *
 * On localhost (no subdomain), URLs are returned unchanged.
 */
export function rewriteMetadataUrls(
	request: Request,
	metadata: OAuthMetadata,
): OAuthMetadata {
	const requestUrl = new URL(request.url);
	const isAuthSubdomain = requestUrl.hostname.split(".")[0] === "auth";

	if (!isAuthSubdomain) {
		return metadata;
	}

	const env = getEnv();
	const internalBase = `${env.BETTER_AUTH_URL}/api/auth`;
	const publicBase = requestUrl.origin;

	const json = JSON.stringify(metadata);
	return JSON.parse(json.replaceAll(internalBase, publicBase));
}
