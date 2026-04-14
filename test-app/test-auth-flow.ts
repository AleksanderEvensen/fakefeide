/**
 * Standalone test script for the FakeFeide OAuth 2.0 / OIDC authentication flow.
 *
 * Tests:
 *  1. OIDC Discovery (.well-known/openid-configuration)
 *  2. Dynamic client registration (public client)
 *  3. Sign-in with email/password
 *  4. Authorization code flow with PKCE + consent
 *  5. Token exchange
 *  6. UserInfo endpoint
 *  7. Token introspection
 *
 * Usage:
 *   bun run test-auth-flow.ts [base-url]
 *
 * Defaults to https://fakefeide.no if no base URL is provided.
 * The script auto-detects the auth subdomain (auth.fakefeide.no) from OIDC discovery.
 *
 * Examples:
 *   bun run test-auth-flow.ts                         # production
 *   bun run test-auth-flow.ts http://localhost:3000    # local dev
 */

const BASE_URL = (process.argv[2] || "https://fakefeide.no").replace(/\/$/, "");

// A known seed user from the app
const TEST_USER = {
	email: "alf.berg@elgskinnetskole.sunnvik.kommune.no",
	password: "password123",
	name: "Alf Berg",
};

const REDIRECT_URI = "http://localhost:9876/callback";

// ─── Helpers ────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
	if (!condition) {
		console.error(`  \u2717 ${message}`);
		failed++;
	} else {
		console.log(`  \u2713 ${message}`);
		passed++;
	}
}

function section(n: number, title: string) {
	console.log(`\n\u2550\u2550\u2550 ${n}. ${title} \u2550\u2550\u2550`);
}

/** Cookie jar — stores cookies across requests like a browser would. */
class CookieJar {
	private cookies: Map<string, string> = new Map();

	update(response: Response) {
		for (const header of response.headers.getSetCookie()) {
			const [pair] = header.split(";");
			const eqIdx = pair.indexOf("=");
			if (eqIdx > 0) {
				this.cookies.set(pair.slice(0, eqIdx).trim(), pair.slice(eqIdx + 1).trim());
			}
		}
	}

	header(): string {
		return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
	}

	has(name: string): boolean {
		return this.cookies.has(name);
	}
}

/** Generate a random code verifier for PKCE. */
function generateCodeVerifier(): string {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return base64UrlEncode(array);
}

/** Derive the S256 code challenge from a verifier. */
async function generateCodeChallenge(verifier: string): Promise<string> {
	const data = new TextEncoder().encode(verifier);
	const digest = await crypto.subtle.digest("SHA-256", data);
	return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(bytes: Uint8Array): string {
	let binary = "";
	for (const b of bytes) binary += String.fromCharCode(b);
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Fetch without following redirects, with cookie jar and Origin header.
 * Better Auth requires Origin for CSRF protection.
 */
async function fetchNoRedirect(url: string, jar: CookieJar, init: RequestInit = {}): Promise<Response> {
	const headers = new Headers(init.headers);
	const cookie = jar.header();
	if (cookie) headers.set("Cookie", cookie);
	// Better Auth requires Origin for CSRF protection
	if (!headers.has("Origin")) {
		headers.set("Origin", new URL(url).origin);
	}

	const res = await fetch(url, { ...init, headers, redirect: "manual" });
	jar.update(res);
	return res;
}

/** Follow redirect chain, collecting cookies. Returns the final response + URL. */
async function followRedirects(
	url: string,
	jar: CookieJar,
	init: RequestInit = {},
	maxRedirects = 15,
): Promise<{ response: Response; finalUrl: string }> {
	let currentUrl = url;
	let response = await fetchNoRedirect(currentUrl, jar, init);

	for (let i = 0; i < maxRedirects; i++) {
		const status = response.status;
		if (status < 300 || status >= 400) break;

		const location = response.headers.get("Location");
		if (!location) break;

		currentUrl = new URL(location, currentUrl).toString();
		response = await fetchNoRedirect(currentUrl, jar);
	}

	return { response, finalUrl: currentUrl };
}

/** Try to parse JSON from a response, return null on failure. */
async function safeJson(res: Response): Promise<any> {
	try {
		return await res.json();
	} catch {
		return null;
	}
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface OIDCConfig {
	issuer: string;
	authorization_endpoint: string;
	token_endpoint: string;
	userinfo_endpoint: string;
	registration_endpoint: string;
	introspection_endpoint?: string;
	jwks_uri: string;
	scopes_supported: string[];
	response_types_supported: string[];
	grant_types_supported: string[];
	[key: string]: unknown;
}

interface ClientRegistration {
	client_id: string;
	client_secret?: string;
	[key: string]: unknown;
}

interface TokenResponse {
	access_token: string;
	token_type: string;
	id_token?: string;
	refresh_token?: string;
	expires_in?: number;
}

// ─── Test Steps ─────────────────────────────────────────────────────────────

/**
 * Resolve the auth API base URL from the OIDC issuer.
 * The issuer is always the Better Auth base URL (e.g. https://fakefeide.no/api/auth).
 */
function resolveAuthApiBase(config: OIDCConfig): string {
	return config.issuer;
}

async function testDiscovery(): Promise<OIDCConfig | null> {
	section(1, "OIDC Discovery");

	const discoveryUrl = `${BASE_URL}/.well-known/openid-configuration`;
	const res = await fetch(discoveryUrl);

	assert(res.ok, `GET ${discoveryUrl} → ${res.status}`);
	if (!res.ok) return null;

	const config: OIDCConfig = await res.json();
	assert(typeof config.issuer === "string", `issuer: ${config.issuer}`);
	assert(typeof config.authorization_endpoint === "string", `authorization_endpoint: ${config.authorization_endpoint}`);
	assert(typeof config.token_endpoint === "string", `token_endpoint: ${config.token_endpoint}`);
	assert(typeof config.userinfo_endpoint === "string", `userinfo_endpoint: ${config.userinfo_endpoint}`);
	assert(typeof config.registration_endpoint === "string", `registration_endpoint: ${config.registration_endpoint}`);
	assert(Array.isArray(config.scopes_supported), `scopes_supported: ${config.scopes_supported?.join(", ")}`);
	assert(config.scopes_supported?.includes("openid"), `"openid" scope supported`);

	return config;
}

async function testClientRegistration(config: OIDCConfig): Promise<ClientRegistration | null> {
	section(2, "Dynamic Client Registration");

	// Register as a public client (token_endpoint_auth_method: "none")
	// This allows unauthenticated registration
	const res = await fetch(config.registration_endpoint, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			client_name: "FakeFeide Test App",
			redirect_uris: [REDIRECT_URI],
			grant_types: ["authorization_code"],
			response_types: ["code"],
			token_endpoint_auth_method: "none",
		}),
	});

	assert(res.ok, `POST registration → ${res.status}`);

	if (!res.ok) {
		const errBody = await safeJson(res);
		if (errBody) {
			console.error(`  → Error: ${errBody.error}: ${errBody.error_description}`);
		}
		return null;
	}

	const client: ClientRegistration = await res.json();
	assert(typeof client.client_id === "string", `client_id: ${client.client_id}`);
	console.log(`  → Public client (no secret)`);

	return client;
}

async function testSignIn(authApiBase: string, jar: CookieJar): Promise<boolean> {
	section(3, "Sign In");

	// First try sign-up in case user doesn't exist yet — ignore errors
	const signUpRes = await fetchNoRedirect(`${authApiBase}/sign-up/email`, jar, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			email: TEST_USER.email,
			password: TEST_USER.password,
			name: TEST_USER.name,
		}),
	});

	const signUpBody = await safeJson(signUpRes);
	if (signUpRes.ok && signUpBody?.user) {
		console.log(`  → Created test user: ${signUpBody.user.email}`);
	} else {
		console.log("  → Sign-up skipped (user may already exist)");
	}

	// Now sign in
	const res = await fetchNoRedirect(`${authApiBase}/sign-in/email`, jar, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			email: TEST_USER.email,
			password: TEST_USER.password,
		}),
	});

	assert(res.status === 200 || res.status === 302, `POST sign-in/email → ${res.status}`);

	if (res.status >= 400) {
		const errBody = await safeJson(res);
		if (errBody) {
			console.error(`  → Error: ${JSON.stringify(errBody)}`);
		}
		return false;
	}

	const body = await safeJson(res);
	if (body?.user) {
		assert(body.user.email === TEST_USER.email, `Signed in as ${body.user.email}`);
	}

	assert(jar.header().length > 0, "Session cookies set");
	return jar.header().length > 0;
}

async function testAuthorizationFlow(
	config: OIDCConfig,
	client: ClientRegistration,
	authApiBase: string,
	jar: CookieJar,
): Promise<{ code: string; codeVerifier: string } | null> {
	section(4, "Authorization Code Flow (PKCE)");

	const codeVerifier = generateCodeVerifier();
	const codeChallenge = await generateCodeChallenge(codeVerifier);
	const state = crypto.randomUUID();

	const authUrl = new URL(config.authorization_endpoint);
	authUrl.searchParams.set("response_type", "code");
	authUrl.searchParams.set("client_id", client.client_id);
	authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
	authUrl.searchParams.set("scope", "openid profile email");
	authUrl.searchParams.set("state", state);
	authUrl.searchParams.set("code_challenge", codeChallenge);
	authUrl.searchParams.set("code_challenge_method", "S256");

	// Hit the authorization endpoint.
	// Better Auth may respond with either:
	//   - A 302 redirect (browser flow)
	//   - A 200 JSON body with { redirect: true, url: "..." } (API flow)
	const authRes = await fetchNoRedirect(authUrl.toString(), jar);
	let redirectTarget = authRes.headers.get("Location") || "";

	// Handle JSON redirect response from Better Auth API
	if (!redirectTarget && authRes.status === 200) {
		const body = await safeJson(authRes);
		if (body?.redirect && body?.url) {
			redirectTarget = body.url;
		}
	}

	assert(
		redirectTarget.length > 0,
		`Authorization request redirects → ${authRes.status} (location: ${redirectTarget.slice(0, 80)}...)`,
	);

	if (!redirectTarget) return null;

	let code = "";

	// Resolve relative URLs
	if (redirectTarget && !redirectTarget.startsWith("http")) {
		redirectTarget = new URL(redirectTarget, authUrl.origin).toString();
	}

	// Check if redirected straight to callback (auto-consent)
	if (redirectTarget.startsWith(REDIRECT_URI)) {
		const callbackUrl = new URL(redirectTarget);
		code = callbackUrl.searchParams.get("code") || "";
		assert(code.length > 0, "Got authorization code (auto-consent)");
		assert(callbackUrl.searchParams.get("state") === state, "State matches");
	} else {
		// Should be redirected to consent page — extract the query string
		// which contains the signed OAuth parameters (sig, exp, etc.)
		const consentUrl = new URL(redirectTarget);
		const oauthQuery = consentUrl.search.slice(1); // strip leading "?"
		console.log(`  → Redirected to consent`);

		// Accept consent via the API, passing the oauth_query from the consent URL
		const consentRes = await fetchNoRedirect(`${authApiBase}/oauth2/consent`, jar, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				accept: true,
				scope: "openid profile email",
				oauth_query: oauthQuery,
			}),
		});

		// Consent response may also be a JSON redirect or a 302
		let consentRedirect = consentRes.headers.get("Location") || "";
		if (!consentRedirect) {
			const consentBody = await safeJson(consentRes);
			if (consentBody?.redirect && consentBody?.url) {
				consentRedirect = consentBody.url;
			} else if (consentBody?.redirect_uri) {
				consentRedirect = consentBody.redirect_uri;
			}
		}

		assert(consentRes.status >= 200 && consentRes.status < 400, `Consent accepted → ${consentRes.status}`);

		// Resolve relative URL
		if (consentRedirect && !consentRedirect.startsWith("http")) {
			consentRedirect = new URL(consentRedirect, authUrl.origin).toString();
		}

		if (consentRedirect?.startsWith(REDIRECT_URI)) {
			code = new URL(consentRedirect).searchParams.get("code") || "";
		} else if (consentRedirect) {
			// Follow redirect chain to find the callback
			const { finalUrl: afterUrl } = await followRedirects(consentRedirect, jar);
			if (afterUrl.startsWith(REDIRECT_URI)) {
				code = new URL(afterUrl).searchParams.get("code") || "";
			}
		}

		// If still no code, re-hit the authorization endpoint (consent is now stored)
		if (!code) {
			console.log("  → Retrying authorization after consent...");
			const retryRes = await fetchNoRedirect(authUrl.toString(), jar);
			let retryRedirect = retryRes.headers.get("Location") || "";
			if (!retryRedirect) {
				const retryBody = await safeJson(retryRes);
				if (retryBody?.redirect && retryBody?.url) {
					retryRedirect = retryBody.url;
				}
			}
			if (retryRedirect && !retryRedirect.startsWith("http")) {
				retryRedirect = new URL(retryRedirect, authUrl.origin).toString();
			}

			if (retryRedirect?.startsWith(REDIRECT_URI)) {
				code = new URL(retryRedirect).searchParams.get("code") || "";
			} else if (retryRedirect) {
				const { finalUrl: retryFinalUrl } = await followRedirects(retryRedirect, jar);
				if (retryFinalUrl.startsWith(REDIRECT_URI)) {
					code = new URL(retryFinalUrl).searchParams.get("code") || "";
				}
			}
		}
	}

	assert(code.length > 0, "Got authorization code");

	if (!code) return null;

	// Verify state if present in the callback
	return { code, codeVerifier };
}

async function testTokenExchange(
	config: OIDCConfig,
	client: ClientRegistration,
	authCode: { code: string; codeVerifier: string },
): Promise<TokenResponse | null> {
	section(5, "Token Exchange");

	const body: Record<string, string> = {
		grant_type: "authorization_code",
		code: authCode.code,
		redirect_uri: REDIRECT_URI,
		code_verifier: authCode.codeVerifier,
		client_id: client.client_id,
	};

	const headers: Record<string, string> = {
		"Content-Type": "application/x-www-form-urlencoded",
	};

	// Public clients send client_id in the body (no Basic auth)
	// Confidential clients use Basic auth
	if (client.client_secret) {
		headers.Authorization = `Basic ${btoa(`${client.client_id}:${client.client_secret}`)}`;
	}

	const res = await fetch(config.token_endpoint, {
		method: "POST",
		headers,
		body: new URLSearchParams(body),
	});

	assert(res.ok, `POST token endpoint → ${res.status}`);

	if (!res.ok) {
		const errBody = await safeJson(res);
		if (errBody) console.error(`  → Error: ${JSON.stringify(errBody)}`);
		return null;
	}

	const tokens: TokenResponse = await res.json();
	assert(typeof tokens.access_token === "string", "access_token present");
	assert(typeof tokens.token_type === "string", `token_type: ${tokens.token_type}`);

	if (tokens.id_token) {
		assert(true, "id_token present");
		try {
			const [, payload] = tokens.id_token.split(".");
			const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
			const claims = JSON.parse(atob(padded.replace(/-/g, "+").replace(/_/g, "/")));
			assert(typeof claims.sub === "string", `id_token sub: ${claims.sub}`);
			if (claims.email) {
				assert(claims.email === TEST_USER.email, `id_token email: ${claims.email}`);
			}
		} catch (e) {
			console.error(`  → Failed to decode id_token: ${e}`);
		}
	}

	if (tokens.refresh_token) {
		assert(true, "refresh_token present");
	}

	if (tokens.expires_in) {
		assert(tokens.expires_in > 0, `expires_in: ${tokens.expires_in}s`);
	}

	return tokens;
}

async function testUserInfo(config: OIDCConfig, accessToken: string): Promise<void> {
	section(6, "UserInfo Endpoint");

	if (!config.userinfo_endpoint) {
		console.log("  \u2298 No userinfo_endpoint in discovery, skipping");
		return;
	}

	const res = await fetch(config.userinfo_endpoint, {
		headers: { Authorization: `Bearer ${accessToken}` },
	});

	assert(res.ok, `GET userinfo → ${res.status}`);

	if (!res.ok) {
		const errBody = await safeJson(res);
		if (errBody) console.error(`  → Error: ${JSON.stringify(errBody)}`);
		return;
	}

	const userinfo = await res.json();
	assert(typeof userinfo.sub === "string", `sub: ${userinfo.sub}`);

	if (userinfo.email) {
		assert(userinfo.email === TEST_USER.email, `email: ${userinfo.email}`);
	}
	if (userinfo.name) {
		assert(userinfo.name === TEST_USER.name, `name: ${userinfo.name}`);
	}

	console.log("  → Full userinfo response:", JSON.stringify(userinfo, null, 2));
}

async function testTokenIntrospection(
	config: OIDCConfig,
	client: ClientRegistration,
	accessToken: string,
): Promise<void> {
	section(7, "Token Introspection");

	if (!config.introspection_endpoint) {
		console.log("  \u2298 No introspection_endpoint in discovery, skipping");
		return;
	}

	if (!client.client_secret) {
		console.log("  \u2298 Public client has no secret — introspection requires client auth, skipping");
		return;
	}

	const headers: Record<string, string> = {
		"Content-Type": "application/x-www-form-urlencoded",
		Authorization: `Basic ${btoa(`${client.client_id}:${client.client_secret}`)}`,
	};

	const res = await fetch(config.introspection_endpoint, {
		method: "POST",
		headers,
		body: new URLSearchParams({
			token: accessToken,
			client_id: client.client_id,
		}),
	});

	assert(res.ok, `POST introspection → ${res.status}`);

	if (!res.ok) {
		const errBody = await safeJson(res);
		if (errBody) console.error(`  → Error: ${JSON.stringify(errBody)}`);
		return;
	}

	const result = await res.json();
	assert(result.active === true, `Token is active: ${result.active}`);

	if (result.scope) {
		assert(true, `Scopes: ${result.scope}`);
	}
	if (result.sub) {
		assert(true, `Subject: ${result.sub}`);
	}
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
	console.log(`\nFakeFeide Auth Flow Test`);
	console.log(`Target: ${BASE_URL}`);
	console.log("\u2550".repeat(50));

	const jar = new CookieJar();

	// 1. Discovery
	const config = await testDiscovery();
	if (!config) {
		console.error("\nCannot proceed without OIDC discovery.");
		process.exit(1);
	}

	const authApiBase = resolveAuthApiBase(config);
	console.log(`  → Auth API base: ${authApiBase}`);

	// 2. Client registration
	const client = await testClientRegistration(config);
	if (!client) {
		console.error("\nCannot proceed without a registered client.");
		printSummary();
		process.exit(1);
	}

	// 3. Sign in
	const signedIn = await testSignIn(authApiBase, jar);
	if (!signedIn) {
		console.error("\nCannot proceed without a session.");
		printSummary();
		process.exit(1);
	}

	// 4. Authorization flow
	const authCode = await testAuthorizationFlow(config, client, authApiBase, jar);
	if (!authCode) {
		console.error("\nCannot proceed without an authorization code.");
		printSummary();
		process.exit(1);
	}

	// 5. Token exchange
	const tokens = await testTokenExchange(config, client, authCode);
	if (!tokens?.access_token) {
		console.error("\nCannot proceed without an access token.");
		printSummary();
		process.exit(1);
	}

	// 6. UserInfo
	await testUserInfo(config, tokens.access_token);

	// 7. Introspection
	await testTokenIntrospection(config, client, tokens.access_token);

	printSummary();
	process.exit(failed > 0 ? 1 : 0);
}

function printSummary() {
	console.log("\n" + "\u2550".repeat(50));
	console.log(`Results: ${passed} passed, ${failed} failed`);
	console.log("\u2550".repeat(50));
}

main();
