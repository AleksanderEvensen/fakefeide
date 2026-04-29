import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/")({ ssr: false, component: App });

function CodeBlock({ children }: { children: string }) {
	return (
		<pre className="overflow-x-auto rounded-md bg-gray-900 p-4 text-sm text-gray-100">
			<code>{children}</code>
		</pre>
	);
}

function EndpointCard({
	method,
	path,
	description,
	auth,
	params,
	queryParams,
	response,
}: {
	method: "GET" | "POST" | "PUT" | "DELETE";
	path: string;
	description: string;
	auth?: string;
	params?: { name: string; description: string }[];
	queryParams?: { name: string; description: string; required?: boolean }[];
	response?: string;
}) {
	const [open, setOpen] = useState(false);
	const methodColors = {
		GET: "bg-emerald-100 text-emerald-800",
		POST: "bg-blue-100 text-blue-800",
		PUT: "bg-amber-100 text-amber-800",
		DELETE: "bg-red-100 text-red-800",
	};

	return (
		<div className="rounded-lg border border-gray-200 bg-white">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="flex w-full items-center gap-3 px-4 py-3 text-left"
			>
				<span className={`shrink-0 rounded px-2 py-0.5 text-xs font-bold ${methodColors[method]}`}>{method}</span>
				<code className="min-w-0 flex-1 text-sm text-gray-800">{path}</code>
				<span className="shrink-0 text-xs text-gray-400">{open ? "\u25B2" : "\u25BC"}</span>
			</button>
			{open && (
				<div className="space-y-3 border-t border-gray-100 px-4 py-3">
					<p className="text-sm text-gray-600">{description}</p>
					{auth && (
						<div>
							<span className="text-xs font-semibold text-gray-500">Authorization:</span>
							<span className="ml-1 text-xs text-gray-600">{auth}</span>
						</div>
					)}
					{params && params.length > 0 && (
						<div>
							<p className="mb-1 text-xs font-semibold text-gray-500">Path parameters</p>
							<ul className="space-y-1">
								{params.map((p) => (
									<li key={p.name} className="text-sm text-gray-600">
										<code className="rounded bg-gray-100 px-1 py-0.5 text-xs">{p.name}</code> &mdash; {p.description}
									</li>
								))}
							</ul>
						</div>
					)}
					{queryParams && queryParams.length > 0 && (
						<div>
							<p className="mb-1 text-xs font-semibold text-gray-500">Query parameters</p>
							<ul className="space-y-1">
								{queryParams.map((p) => (
									<li key={p.name} className="text-sm text-gray-600">
										<code className="rounded bg-gray-100 px-1 py-0.5 text-xs">{p.name}</code>
										{p.required && <span className="ml-1 text-xs text-red-500">required</span>} &mdash; {p.description}
									</li>
								))}
							</ul>
						</div>
					)}
					{response && (
						<div>
							<p className="mb-1 text-xs font-semibold text-gray-500">Example response</p>
							<CodeBlock>{response}</CodeBlock>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
	return (
		<h2 id={id} className="text-xl font-bold text-gray-900">
			{children}
		</h2>
	);
}

function SessionCard() {
	const { data: session, isPending } = authClient.useSession();

	if (isPending) return null;

	if (!session) {
		return (
			<div className="mb-10 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
				<p className="text-sm text-gray-600">Not signed in</p>
				<Link
					to="/sign-in"
					className="ml-4 shrink-0 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-100"
				>
					Sign in
				</Link>
			</div>
		);
	}

	return (
		<div className="mb-10 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
			<div className="min-w-0">
				<p className="text-sm font-medium text-emerald-900">
					Signed in as <span className="font-semibold">{session.user.name}</span>
				</p>
				<p className="truncate text-xs text-emerald-700">{session.user.email}</p>
			</div>
			<button
				type="button"
				onClick={() => authClient.signOut()}
				className="ml-4 shrink-0 rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
			>
				Sign out
			</button>
		</div>
	);
}

function App() {
	return (
		<main className="mx-auto max-w-3xl px-4 pb-16 pt-12">
			{/* Hero */}
			<div className="mb-10">
				<h1 className="text-3xl font-bold text-gray-900">FakeFeide</h1>
				<p className="mt-2 text-lg text-gray-600">
					A fake Feide identity provider for testing and development. OAuth 2.0 / OpenID Connect compliant.
				</p>
			</div>

			<SessionCard />

			{/* Overview */}
			<section className="mb-10 space-y-3">
				<SectionHeading id="overview">Overview</SectionHeading>
				<p className="text-sm leading-relaxed text-gray-600">
					FakeFeide provides a simulated Feide-like identity provider so your application can authenticate users without
					needing access to the real Feide service. It supports dynamic client registration, the authorization code
					flow, and standard OIDC discovery metadata.
				</p>
				<div className="grid gap-3 sm:grid-cols-3">
					<div className="rounded-lg border border-gray-200 bg-white p-4">
						<p className="text-sm font-semibold text-gray-900">OAuth 2.0 / OIDC</p>
						<p className="mt-1 text-xs text-gray-500">
							Authorization code flow with PKCE support, JWKS, token introspection and revocation.
						</p>
					</div>
					<div className="rounded-lg border border-gray-200 bg-white p-4">
						<p className="text-sm font-semibold text-gray-900">Dynamic registration</p>
						<p className="mt-1 text-xs text-gray-500">
							Register OAuth clients at runtime without authentication &mdash; ideal for dev/test workflows.
						</p>
					</div>
					<div className="rounded-lg border border-gray-200 bg-white p-4">
						<p className="text-sm font-semibold text-gray-900">Groups API</p>
						<p className="mt-1 text-xs text-gray-500">
							Feide-compatible groups API with organizations, education groups, and membership data.
						</p>
					</div>
				</div>
			</section>

			{/* Quick start */}
			<section className="mb-10 space-y-3">
				<SectionHeading id="quick-start">Quick start</SectionHeading>
				<p className="text-sm text-gray-600">
					Point your OIDC client at FakeFeide&apos;s discovery endpoint to get started:
				</p>
				<CodeBlock>
					{`# Discovery endpoint
GET https://fakefeide.no/api/auth/.well-known/openid-configuration

# Or for local development
GET http://localhost:3000/api/auth/.well-known/openid-configuration`}
				</CodeBlock>
				<p className="text-sm text-gray-600">Register a client dynamically:</p>
				<CodeBlock>
					{`POST https://fakefeide.no/api/auth/oauth2/register
Content-Type: application/json

{
  "client_name": "My Test App",
  "redirect_uris": ["http://localhost:8080/callback"],
  "grant_types": ["authorization_code"],
  "response_types": ["code"],
  "scope": "openid profile email"
}`}
				</CodeBlock>
			</section>

			{/* Supported scopes */}
			<section className="mb-10 space-y-3">
				<SectionHeading id="scopes">Supported scopes</SectionHeading>
				<div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
					<table className="w-full text-left text-sm">
						<thead className="border-b border-gray-200 bg-gray-50">
							<tr>
								<th className="px-4 py-2 font-semibold text-gray-700">Scope</th>
								<th className="px-4 py-2 font-semibold text-gray-700">Description</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							<tr>
								<td className="px-4 py-2">
									<code className="text-xs">openid</code>
								</td>
								<td className="px-4 py-2 text-gray-600">OpenID Connect authentication</td>
							</tr>
							<tr>
								<td className="px-4 py-2">
									<code className="text-xs">profile</code>
								</td>
								<td className="px-4 py-2 text-gray-600">Access user name and profile info</td>
							</tr>
							<tr>
								<td className="px-4 py-2">
									<code className="text-xs">email</code>
								</td>
								<td className="px-4 py-2 text-gray-600">Access email address</td>
							</tr>
							<tr>
								<td className="px-4 py-2">
									<code className="text-xs">offline_access</code>
								</td>
								<td className="px-4 py-2 text-gray-600">Issue refresh tokens for long-lived sessions</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			{/* OIDC / OAuth endpoints */}
			<section className="mb-10 space-y-3">
				<SectionHeading id="oidc-endpoints">OIDC / OAuth endpoints</SectionHeading>
				<p className="text-sm text-gray-600">
					All OAuth/OIDC endpoints are served under{" "}
					<code className="rounded bg-gray-100 px-1 py-0.5 text-xs">fakefeide.no/api/auth</code> in production, or{" "}
					<code className="rounded bg-gray-100 px-1 py-0.5 text-xs">localhost:3000/api/auth</code> locally.
				</p>
				<div className="space-y-2">
					<EndpointCard
						method="GET"
						path="/api/auth/.well-known/openid-configuration"
						description="OpenID Connect discovery document. Returns metadata about the identity provider including all endpoint URLs, supported scopes, grant types, and signing algorithms."
						response={`{
  "issuer": "https://fakefeide.no/api/auth",
  "authorization_endpoint": "https://fakefeide.no/api/auth/oauth2/authorize",
  "token_endpoint": "https://fakefeide.no/api/auth/oauth2/token",
  "jwks_uri": "https://fakefeide.no/api/auth/jwks",
  "registration_endpoint": "https://fakefeide.no/api/auth/oauth2/register",
  "scopes_supported": ["openid", "profile", "email", "offline_access"],
  ...
}`}
					/>
					<EndpointCard
						method="GET"
						path="/api/auth/.well-known/oauth-authorization-server"
						description="OAuth 2.0 Authorization Server Metadata. Similar to the OIDC discovery document but follows RFC 8414."
					/>
					<EndpointCard
						method="GET"
						path="/oauth2/authorize"
						description="Authorization endpoint. Redirects the user to the login page if not authenticated, then to the consent page. Returns an authorization code on approval."
						queryParams={[
							{
								name: "response_type",
								description: '"code" for authorization code flow',
								required: true,
							},
							{
								name: "client_id",
								description: "The registered client ID",
								required: true,
							},
							{
								name: "redirect_uri",
								description: "Where to redirect after authorization",
								required: true,
							},
							{
								name: "scope",
								description: 'Space-separated scopes (e.g. "openid profile email")',
							},
							{
								name: "state",
								description: "Opaque value for CSRF protection",
							},
							{
								name: "code_challenge",
								description: "PKCE code challenge",
							},
							{
								name: "code_challenge_method",
								description: '"S256" or "plain"',
							},
						]}
					/>
					<EndpointCard
						method="POST"
						path="/oauth2/token"
						description="Token endpoint. Exchange an authorization code for access/ID tokens, or refresh an existing token."
						auth="Client credentials (Basic auth or client_secret in body)"
						response={`{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "id_token": "...",
  "refresh_token": "...",
  "scope": "openid profile email"
}`}
					/>
					<EndpointCard
						method="POST"
						path="/oauth2/register"
						description="Dynamic client registration endpoint. Registers a new OAuth client without authentication."
						response={`{
  "client_id": "...",
  "client_secret": "...",
  "client_name": "My Test App",
  "redirect_uris": ["http://localhost:8080/callback"],
  "grant_types": ["authorization_code"],
  "response_types": ["code"]
}`}
					/>
					<EndpointCard
						method="GET"
						path="/jwks"
						description="JSON Web Key Set. Returns the public keys used to verify ID token signatures."
					/>
					<EndpointCard
						method="GET"
						path="/userinfo"
						description="UserInfo endpoint. Returns claims about the authenticated user."
						auth="Bearer token"
						response={`{
  "sub": "...",
  "name": "Ola Nordmann",
  "email": "ola@example.edu"
}`}
					/>
					<EndpointCard
						method="POST"
						path="/oauth2/revoke"
						description="Token revocation endpoint. Revokes an access or refresh token."
						auth="Client credentials"
					/>
				</div>
			</section>

			{/* Groups API */}
			<section className="mb-10 space-y-3">
				<SectionHeading id="groups-api">Groups API</SectionHeading>
				<p className="text-sm text-gray-600">
					Feide-compatible groups API. All endpoints require a valid Bearer token. Base path:{" "}
					<code className="rounded bg-gray-100 px-1 py-0.5 text-xs">/api/groups</code> locally, or use the dedicated
					subdomain <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">groups-api.fakefeide.no</code> in
					production (which strips the <code className="text-xs">/api/groups</code> prefix automatically).
				</p>
				<div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
					<p className="text-sm text-blue-800">In production, both paths work:</p>
					<ul className="mt-1 space-y-0.5 text-sm text-blue-700">
						<li>
							<code className="text-xs">fakefeide.no/api/groups/grouptypes</code>
						</li>
						<li>
							<code className="text-xs">groups-api.fakefeide.no/grouptypes</code>
						</li>
					</ul>
				</div>

				<h3 className="pt-2 text-sm font-semibold text-gray-700">Group types</h3>
				<div className="space-y-2">
					<EndpointCard
						method="GET"
						path="/api/groups/grouptypes"
						description="List all available group types (org, orgunit, education groups, grep codes, etc.)."
						response={`[
  { "id": "fc:org", "displayName": "Organization" },
  { "id": "fc:gogroup", "displayName": "Education Group" },
  { "id": "fc:grep", "displayName": "Grep" },
  ...
]`}
					/>
				</div>

				<h3 className="pt-2 text-sm font-semibold text-gray-700">Current user (me)</h3>
				<div className="space-y-2">
					<EndpointCard
						method="GET"
						path="/api/groups/me/groups"
						description="List all groups the authenticated user is a member of, including membership details."
						auth="Bearer token (user token required)"
						response={`[
  {
    "id": "fc:gogroup:example.edu:...",
    "type": "fc:gogroup",
    "displayName": "INF101 - Spring 2025",
    "membership": { "basic": "member", ... }
  }
]`}
					/>
					<EndpointCard
						method="GET"
						path="/api/groups/me/groups/:groupId"
						description="Get a specific group the authenticated user is a member of."
						auth="Bearer token (user token required)"
						params={[
							{
								name: "groupId",
								description: "The full group ID (URL-encoded)",
							},
						]}
					/>
				</div>

				<h3 className="pt-2 text-sm font-semibold text-gray-700">Groups</h3>
				<div className="space-y-2">
					<EndpointCard
						method="GET"
						path="/api/groups/groups"
						description="List groups. Without filters, returns groups the authenticated user is a member of. With filters, searches across all groups."
						auth="Bearer token"
						queryParams={[
							{
								name: "go_type",
								description: 'Filter by education group type (e.g. "emne", "klasse")',
							},
							{
								name: "grep_code",
								description: "Filter by Grep code",
							},
							{
								name: "orgunit",
								description: "Filter by parent organization unit",
							},
							{
								name: "showAll",
								description: '"true" to include expired groups',
							},
						]}
					/>
					<EndpointCard
						method="GET"
						path="/api/groups/groups/:groupId"
						description="Get a single group by its ID."
						auth="Bearer token"
						params={[
							{
								name: "groupId",
								description: "The full group ID (URL-encoded)",
							},
						]}
					/>
					<EndpointCard
						method="GET"
						path="/api/groups/groups/:groupId/members"
						description="List members of a group."
						auth="Bearer token"
						params={[
							{
								name: "groupId",
								description: "The full group ID (URL-encoded)",
							},
						]}
						queryParams={[
							{
								name: "affiliation",
								description: 'Filter by affiliation (e.g. "student", "faculty")',
							},
						]}
						response={`[
  {
    "name": "Ola Nordmann",
    "userid_sec": ["feide:ola@example.edu"],
    "membership": { "basic": "member", "affiliation": "student" }
  }
]`}
					/>
				</div>

				<h3 className="pt-2 text-sm font-semibold text-gray-700">Organizations</h3>
				<p className="text-xs text-gray-500">
					Requires <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">system-all-users</code> scope.
				</p>
				<div className="space-y-2">
					<EndpointCard
						method="GET"
						path="/api/groups/v1/orgs/:domain/groups"
						description="List all groups under an organization domain (up to 2 levels deep). Supports cursor-based pagination."
						auth="Bearer token (system-all-users scope)"
						params={[
							{
								name: "domain",
								description: 'Organization domain (e.g. "example.edu")',
							},
						]}
						queryParams={[
							{
								name: "go_type",
								description: "Filter by education group type",
							},
							{
								name: "showAll",
								description: '"true" to include expired groups',
							},
							{
								name: "per_page",
								description: "Results per page (default 100, max 1000)",
							},
							{
								name: "cursor",
								description: "Pagination cursor (group ID from previous page)",
							},
						]}
					/>
					<EndpointCard
						method="GET"
						path="/api/groups/v1/orgs/:domain/groups/:groupId"
						description="Get a single group under an organization, verifying it belongs to the org (up to 2 levels)."
						auth="Bearer token (system-all-users scope)"
						params={[
							{
								name: "domain",
								description: "Organization domain",
							},
							{
								name: "groupId",
								description: "The full group ID (URL-encoded)",
							},
						]}
					/>
					<EndpointCard
						method="GET"
						path="/api/groups/v1/orgs/:domain/groups/:groupId/members"
						description="List members of a group under an organization."
						auth="Bearer token (system-all-users scope)"
						params={[
							{
								name: "domain",
								description: "Organization domain",
							},
							{
								name: "groupId",
								description: "The full group ID (URL-encoded)",
							},
						]}
						queryParams={[
							{
								name: "affiliation",
								description: "Filter by affiliation",
							},
						]}
					/>
				</div>
			</section>

			{/* Auth flow */}
			<section className="mb-10 space-y-3">
				<SectionHeading id="auth-flow">Authentication flow</SectionHeading>
				<div className="rounded-lg border border-gray-200 bg-white p-4">
					<ol className="list-inside list-decimal space-y-2 text-sm text-gray-600">
						<li>
							Register a client via <code className="text-xs">POST /oauth2/register</code>
						</li>
						<li>
							Redirect users to <code className="text-xs">/oauth2/authorize?response_type=code&client_id=...</code>
						</li>
						<li>
							User logs in at the{" "}
							<Link to="/sign-in" className="text-[#1f4698] underline">
								sign-in page
							</Link>{" "}
							(or use a pre-seeded test account)
						</li>
						<li>User approves the consent screen</li>
						<li>FakeFeide redirects back with an authorization code</li>
						<li>
							Exchange the code for tokens via <code className="text-xs">POST /oauth2/token</code>
						</li>
						<li>Use the access token to call the UserInfo or Groups API</li>
					</ol>
				</div>
			</section>

			{/* Domains */}
			<section className="space-y-3">
				<SectionHeading id="domains">Production domains</SectionHeading>
				<div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
					<table className="w-full text-left text-sm">
						<thead className="border-b border-gray-200 bg-gray-50">
							<tr>
								<th className="px-4 py-2 font-semibold text-gray-700">Domain</th>
								<th className="px-4 py-2 font-semibold text-gray-700">Purpose</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							<tr>
								<td className="px-4 py-2">
									<code className="text-xs">fakefeide.no</code>
								</td>
								<td className="px-4 py-2 text-gray-600">
									Main application, OAuth/OIDC endpoints (under <code className="text-xs">/api/auth</code>), sign-in,
									consent
								</td>
							</tr>
							<tr>
								<td className="px-4 py-2">
									<code className="text-xs">groups-api.fakefeide.no</code>
								</td>
								<td className="px-4 py-2 text-gray-600">
									Groups API (rewrites to <code className="text-xs">/api/groups</code>)
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>
		</main>
	);
}
