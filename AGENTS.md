<!-- intent-skills:start -->

# Skill mappings - when working in these areas, load the linked skill file into context.

skills:

- task: "Working with routes, navigation, path params, search params, or route config"
  load: "node_modules/@tanstack/router-core/skills/router-core/SKILL.md"
- task: "Server functions, API routes, middleware, or SSR"
  load: "node_modules/@tanstack/start-client-core/skills/start-core/SKILL.md"
- task: "Deploying to Cloudflare Workers"
  load: "node_modules/@tanstack/start-client-core/skills/start-core/deployment/SKILL.md"
- task: "Setting up or configuring TanStack Devtools"
load: "node_modules/@tanstack/devtools-vite/skills/devtools-vite-plugin/SKILL.md"
<!-- intent-skills:end -->

# FakeFeide

A fake Feide identity provider — an OAuth 2.0 / OpenID Connect server built for testing and development purposes, allowing applications to authenticate against a simulated Feide-like IdP without needing access to the real service.

## Tech Stack

| Layer       | Technology                                                     |
| ----------- | -------------------------------------------------------------- |
| Framework   | TanStack Start (React 19, Vite 8, file-based routing with SSR) |
| Auth        | Better Auth with `@better-auth/oauth-provider` plugin          |
| Database    | Turso (libSQL) via Drizzle ORM                                 |
| Styling     | Tailwind CSS 4 + shadcn/ui components                          |
| Deployment  | Cloudflare Workers (`@cloudflare/vite-plugin`)                 |
| Package mgr | Bun                                                            |
| Linting     | oxlint (with typescript, unicorn, oxc plugins)                 |
| Formatting  | oxfmt                                                          |
| Type check  | TypeScript 5.7 (strict mode, `noEmit`)                         |

## Project Structure

```
src/
├── api-routes/
│   └── well-known/          # OIDC/.well-known endpoint handlers
├── components/
│   └── ui/                  # shadcn/ui primitives (button, input, label, etc.)
├── db/
│   ├── index.ts             # Drizzle client (Turso via libsql/web)
│   └── schema.ts            # Drizzle schema definitions
├── hooks/                   # React hooks
├── integrations/
│   ├── better-auth/         # Auth header integration
│   └── tanstack-query/      # QueryClient provider & devtools
├── lib/
│   ├── auth.ts              # Better Auth server config (OAuth provider, JWT, email/password)
│   ├── auth-client.ts       # Better Auth React client
│   └── utils.ts             # Shared utilities (cn helper)
├── routes/
│   ├── __root.tsx            # Root layout (HTML shell, devtools, stylesheets)
│   ├── index.tsx             # Home page
│   ├── about.tsx             # About page
│   ├── sign-in.tsx           # Sign-in / sign-up form
│   ├── consent.tsx           # OAuth consent screen
│   └── api/auth/$.ts         # Better Auth catch-all API handler
├── router.tsx                # TanStack Router factory with SSR query integration
├── routeTree.gen.ts          # Auto-generated route tree (do NOT edit)
└── styles.css                # Global styles / Tailwind entry
```

## Key Concepts

### OAuth Provider

The core purpose of this app is to act as an OAuth 2.0 / OIDC identity provider. Better Auth's `oauthProvider` plugin handles:

- Dynamic client registration (unauthenticated)
- Authorization code flow
- Scopes: `openid`, `profile`, `email`, `offline_access`
- Login redirects to `/sign-in`, consent to `/consent`

### Well-Known Endpoints

Two server-side route handlers expose standard OIDC discovery metadata:

- `/.well-known/openid-configuration` — OpenID Connect discovery
- `/.well-known/oauth-authorization-server` — OAuth 2.0 authorization server metadata

Both set CORS headers for cross-origin access.

### Auth API

All Better Auth API requests are handled by a catch-all route at `/api/auth/$` which delegates to `auth.handler(request)` for both GET and POST methods.

### Database

Uses Turso (hosted libSQL) via the `@libsql/client/web` driver, wrapped with Drizzle ORM. The database client imports `env` from `cloudflare:workers` for runtime environment access.

### Path Aliases

Two aliases are configured and interchangeable:

- `#/*` → `./src/*` (used in imports throughout the codebase)
- `@/*` → `./src/*`

## Commands

```bash
bun run dev            # Start dev server on port 3000
bun run build          # Vite build + tsc type check
bun run deploy         # Build and deploy to Cloudflare Workers
bun run lint           # Run oxlint
bun run lint:fix       # Run oxlint with auto-fix
bun run fmt            # Format with oxfmt
bun run fmt:check      # Check formatting
bun run test           # Run vitest
bun run db:generate    # Generate Drizzle migrations
bun run db:migrate     # Run Drizzle migrations
bun run db:push        # Push schema changes directly
bun run db:studio      # Open Drizzle Studio
```

## Environment Variables

See `.env.example`. Required:

- `BETTER_AUTH_URL` — Base URL for Better Auth (e.g. `http://localhost:3000`)
- `BETTER_AUTH_SECRET` — Secret key (generate with `bunx --bun @better-auth/cli secret`)
- `TURSO_DATABASE_URL` — Turso database URL
- `TURSO_DATABASE_AUTH_TOKEN` — Turso auth token

For production, secrets are pushed to Cloudflare Workers via the justfile (`just cf-env`).

## Conventions

- Use `#/` import alias for internal imports (e.g. `import { auth } from '#/lib/auth'`)
- Routes live in `src/routes/` following TanStack Router file-based conventions
- Server-only route handlers use the `server: { handlers: { GET, POST } }` pattern
- UI components use shadcn/ui in `src/components/ui/`
- Do not edit `src/routeTree.gen.ts` — it is auto-generated
- A post-tool hook runs oxlint + oxfmt on every file write/edit
