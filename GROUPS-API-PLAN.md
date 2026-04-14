# Groups API Implementation Plan

This document describes how to implement a clone of the [Feide Groups API](https://docs.feide.no/reference/apis/groups_api/index.html) within the FakeFeide project. The goal is an API-compatible replica that returns realistic fake data for testing.

## 1. Overview

The Groups API serves group membership information over REST. A user belongs to groups of various types (classes, courses, organizations, ad-hoc groups, etc.). The API is accessed via OAuth 2.0 tokens — either user-bound (personal) or client credentials (system-level).

**Base URL (production):** `https://groups-api.fakefeide.no/groups`

This will be a second subdomain rewrite: `groups-api.fakefeide.no` rewrites internally to `/api/groups` using the same pattern as `auth.fakefeide.no` → `/api/auth`.

---

## 2. API Endpoints

All endpoints live under the `/api/groups` internal base path.

### User-scoped endpoints (require user-bound OAuth token)

| Method | Internal Path                          | Public Path (subdomain)     | Description                               |
| ------ | -------------------------------------- | --------------------------- | ----------------------------------------- |
| GET    | `/api/groups/me/groups`                | `/me/groups`                | List current user's groups                |
| GET    | `/api/groups/me/groups/{groupid}`      | `/me/groups/{groupid}`      | Get user's membership in a specific group |
| GET    | `/api/groups/groups/{groupid}`         | `/groups/{groupid}`         | Get group details                         |
| GET    | `/api/groups/groups/{groupid}/members` | `/groups/{groupid}/members` | List group members                        |
| GET    | `/api/groups/groups`                   | `/groups`                   | List/query groups                         |
| GET    | `/api/groups/grouptypes`               | `/grouptypes`               | List available group types                |

### Organization-scoped endpoints (require client credentials + `system-all-users` scope)

| Method | Internal Path                                           | Public Path (subdomain)                      | Description                 |
| ------ | ------------------------------------------------------- | -------------------------------------------- | --------------------------- |
| GET    | `/api/groups/v1/orgs/{domain}/groups`                   | `/v1/orgs/{domain}/groups`                   | List org groups (paginated) |
| GET    | `/api/groups/v1/orgs/{domain}/groups/{groupid}`         | `/v1/orgs/{domain}/groups/{groupid}`         | Get org group details       |
| GET    | `/api/groups/v1/orgs/{domain}/groups/{groupid}/members` | `/v1/orgs/{domain}/groups/{groupid}/members` | List org group members      |

### Query parameters

- `showAll=true` — include expired/inactive groups or members
- `affiliation=<value>` — filter org group members by affiliation (e.g. `student`)
- `go_type=<value>` — filter by education group type (`a`, `b`, `u`)
- `grep_code=<value>` — filter by Grep subject code
- `orgunit=<value>` — filter by org unit (prefixed `NO` or `U`)
- `per_page=<n>` — page size for org group listing (default 100)

### Pagination

Organization group listing uses cursor-based pagination via the `Link` header with `rel="next"`.

### Error responses

- `403 Forbidden` — missing scope, wrong token type, or access denied
- `404 Not Found` — group or membership not found

---

## 3. Group Types Reference

Every group has a `type` field. Here are all the types the API must support:

### 3.1 Organization (`fc:org`)

Used for both school owners (primary/secondary) and higher education institutions.

**ID format:** `fc:org:<realm>`

| Field               | Type     | Required | Notes                                                                               |
| ------------------- | -------- | -------- | ----------------------------------------------------------------------------------- |
| `id`                | string   | yes      | `fc:org:<realm>`                                                                    |
| `type`              | string   | yes      | always `fc:org`                                                                     |
| `displayName`       | string   | yes      |                                                                                     |
| `public`            | boolean  | yes      | always `false`                                                                      |
| `orgType`           | string[] | yes      | `primary_and_lower_secondary_owner`, `upper_secondary_owner`, or `higher_education` |
| `eduOrgLegalName`   | string   | yes      |                                                                                     |
| `norEduOrgNIN`      | string   | yes      | `NO` + 9-digit org number                                                           |
| `mail`              | string   | yes      |                                                                                     |
| `parent`            | string   | no       | not present for top-level orgs                                                      |
| `membership`        | object   | no       | only when fetching for a user                                                       |
| `eduOrgHomePageURI` | string   | no       |                                                                                     |
| `norEduOrgAcronym`  | string   | no       |                                                                                     |
| `postalAddress`     | string   | no       |                                                                                     |
| `postalCode`        | string   | no       |                                                                                     |
| `street`            | string   | no       |                                                                                     |
| `telephoneNumber`   | string   | no       |                                                                                     |
| `l`                 | string   | no       | location/city                                                                       |

**Membership fields (org context):**

| Field                | Type     | Required                                       |
| -------------------- | -------- | ---------------------------------------------- |
| `basic`              | string   | yes — `admin` (employees) or `member`          |
| `displayName`        | string   | yes                                            |
| `affiliation`        | string[] | yes — e.g. `["member", "employee", "faculty"]` |
| `primaryAffiliation` | string   | no                                             |
| `title`              | string[] | no                                             |

### 3.2 Organization Unit (`fc:orgunit`)

Sub-units of an organization (departments, faculties). Higher education only.

**ID format:** `fc:org:<realm>:unit:<orgunit-id>`

| Field         | Type    | Required                  |
| ------------- | ------- | ------------------------- |
| `id`          | string  | yes                       |
| `type`        | string  | yes — always `fc:orgunit` |
| `displayName` | string  | yes                       |
| `public`      | boolean | yes — always `false`      |
| `parent`      | string  | yes — parent org's `id`   |
| `membership`  | object  | no                        |

**Membership fields:**

| Field            | Type    | Required              |
| ---------------- | ------- | --------------------- |
| `basic`          | string  | yes — always `member` |
| `primaryOrgUnit` | boolean | yes                   |

### 3.3 School Unit (`fc:org` with `unit:`)

Schools belonging to a school owner. Same `fc:org` type but with a unit suffix.

**ID format:** `fc:org:<realm>:unit:<NO + org-number>`

| Field         | Type     | Required                                                 |
| ------------- | -------- | -------------------------------------------------------- |
| `id`          | string   | yes                                                      |
| `type`        | string   | yes — `fc:org`                                           |
| `displayName` | string   | yes                                                      |
| `public`      | boolean  | yes — `false`                                            |
| `orgType`     | string[] | yes — `primary_and_lower_secondary` or `upper_secondary` |
| `parent`      | string   | yes — school owner's `id`                                |
| `membership`  | object   | no                                                       |

**Membership fields:**

| Field           | Type    | Required              |
| --------------- | ------- | --------------------- |
| `basic`         | string  | yes — always `member` |
| `primarySchool` | boolean | yes                   |

### 3.4 Education Groups (`fc:gogroup`)

Basis groups, teaching groups, and "other" education groups. Distinguished by `go_type`.

**ID format:** `fc:gogroup:<realm>:<go_type>:<org-number>:<local-id>:<start-date>:<end-date>`

| Field                 | Type   | Required | Notes                                                              |
| --------------------- | ------ | -------- | ------------------------------------------------------------------ |
| `id`                  | string | yes      |                                                                    |
| `type`                | string | yes      | always `fc:gogroup`                                                |
| `displayName`         | string | yes      |                                                                    |
| `go_type`             | string | yes      | `b` (basis), `u` (teaching), `a` (other)                           |
| `go_type_displayName` | string | yes      | `basisgruppe`, `undervisningsgruppe`, or `andre grupper`           |
| `notBefore`           | string | yes      | ISO 8601                                                           |
| `notAfter`            | string | yes      | ISO 8601                                                           |
| `parent`              | string | yes      | school or school owner id                                          |
| `grep`                | object | no       | only for teaching groups (`u`) — contains `displayName` and `code` |
| `membership`          | object | no       |                                                                    |

**Membership fields:**

| Field         | Type          | Required                                        |
| ------------- | ------------- | ----------------------------------------------- |
| `basic`       | string        | yes — `admin` (teachers) or `member` (students) |
| `affiliation` | string        | yes — `student` or `faculty`                    |
| `displayName` | string/object | yes — may be localized `{ "nb": "Elev" }`       |

### 3.5 Grep Groups (`fc:grep` / `fc:grep2`)

References to entries in Norway's national curriculum database (Grep).

**ID formats:**

- `fc:grep:<escaped-grep-id>`
- `fc:grep2:<realm>:<urlencoded-grep-id>`

| Field         | Type    | Required                                                                 |
| ------------- | ------- | ------------------------------------------------------------------------ |
| `id`          | string  | yes                                                                      |
| `type`        | string  | yes — `fc:grep` or `fc:grep2`                                            |
| `displayName` | string  | yes                                                                      |
| `public`      | boolean | yes — always `true`                                                      |
| `grep_type`   | string  | yes — `fagkoder`, `programomraader`, `utdanningsprogram`, or `aarstrinn` |
| `code`        | string  | yes — Grep code (e.g. `MAT0009`)                                         |
| `membership`  | object  | no                                                                       |

**Membership:** `basic` is always `member`.

### 3.6 FS Groups (Higher Education — Felles Studentsystem)

All FS groups share the same membership structure:

| Field              | Type     | Required                                               |
| ------------------ | -------- | ------------------------------------------------------ |
| `basic`            | string   | yes — `owner` (instructors) or `member` (students)     |
| `active`           | boolean  | yes                                                    |
| `displayName`      | string   | yes                                                    |
| `fsroles`          | string[] | yes — e.g. `["STUDENT"]`                               |
| `notBefore`        | string   | no — ISO 8601                                          |
| `notAfter`         | string   | no — ISO 8601                                          |
| `subjectRelations` | string   | only on courses — `undervisning`, `vurdering`, or both |

#### FS Program of Study (`fc:fs:prg`)

- **ID:** `fc:fs:fs:prg:<realm>:<program-code>`
- Fields: `id`, `type`, `displayName`, `parent` (org id), `url` (optional)

#### FS Cohort (`fc:fs:prg` — same type as program)

- **ID:** `fc:fs:fs:kull:<realm>:<program-code>:<cohort>`
- Fields: `id`, `type`, `displayName`, `parent` (program id)

#### FS Class (`fc:fs:klasse`)

- **ID:** `fc:fs:fs:klasse:<realm>:<program>:<cohort>:<class>`
- Fields: `id`, `type`, `displayName`, `parent` (cohort id)

#### FS Course (`fc:fs:emne`)

- **ID:** `fc:fs:fs:emne:<realm>:<course-id>:<version>`
- Fields: `id`, `type`, `displayName`, `parent` (org id), `url` (optional)

#### FS Field of Study (`fc:fs:str`)

- **ID:** `fc:fs:fs:str:<realm>:<field-code>`
- Fields: `id`, `type`, `displayName`, `parent` (org id)

---

## 4. Database Schema

Use Drizzle ORM with the existing Turso/libSQL database. The schema needs to store groups, users' memberships, and the various type-specific fields.

### Design approach

Use a **single `groups` table** with a JSON `extra` column for type-specific fields, plus a **`group_memberships`** junction table. This avoids a table-per-group-type explosion while keeping queries simple.

### Tables

```
groups
├── id              TEXT PRIMARY KEY     -- the fc:... identifier
├── type            TEXT NOT NULL        -- fc:org, fc:orgunit, fc:gogroup, fc:grep, voot:ad-hoc, fc:fs:prg, fc:fs:klasse, fc:fs:emne, fc:fs:str
├── display_name    TEXT NOT NULL
├── parent_id       TEXT                 -- FK → groups.id (nullable, top-level orgs have none)
├── public          INTEGER DEFAULT 0    -- boolean: 1 for grep groups, 0 for most others
├── not_before      TEXT                 -- ISO 8601, nullable (only education/FS groups)
├── not_after       TEXT                 -- ISO 8601, nullable
├── extra           TEXT                 -- JSON blob for type-specific fields
└── created_at      TEXT DEFAULT CURRENT_TIMESTAMP

group_memberships
├── id              INTEGER PRIMARY KEY AUTOINCREMENT
├── group_id        TEXT NOT NULL        -- FK → groups.id
├── user_id         TEXT NOT NULL        -- FK → better-auth user table
├── basic           TEXT NOT NULL        -- member, admin, or owner
├── extra           TEXT                 -- JSON blob for type-specific membership fields
└── created_at      TEXT DEFAULT CURRENT_TIMESTAMP
```

### What goes in `extra` (groups)

| Group type           | `extra` fields                                                                                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fc:org`             | `orgType`, `eduOrgLegalName`, `norEduOrgNIN`, `mail`, `norEduOrgAcronym`, `postalAddress`, `postalCode`, `street`, `telephoneNumber`, `l`, `eduOrgHomePageURI` |
| `fc:orgunit`         | (none needed — `parent` covers it)                                                                                                                             |
| `fc:gogroup`         | `go_type`, `go_type_displayName`, `grep` (for teaching groups)                                                                                                 |
| `fc:grep`/`fc:grep2` | `grep_type`, `code`                                                                                                                                            |
| `voot:ad-hoc`        | `description`                                                                                                                                                  |
| FS types             | `url` (for programs/courses)                                                                                                                                   |

### What goes in `extra` (memberships)

| Context                    | `extra` fields                                                                  |
| -------------------------- | ------------------------------------------------------------------------------- |
| Org membership             | `displayName`, `affiliation`, `primaryAffiliation`, `title`                     |
| School membership          | `primarySchool`                                                                 |
| Org unit membership        | `primaryOrgUnit`                                                                |
| Education group membership | `affiliation`, `displayName`                                                    |
| FS membership              | `active`, `displayName`, `fsroles`, `notBefore`, `notAfter`, `subjectRelations` |
| Ad hoc / grep              | (none needed)                                                                   |

---

## 5. Implementation Steps

### Step 1: Database schema

1. Add the `groups` and `group_memberships` tables to `src/db/schema.ts`
2. Run `bun run db:generate` and `bun run db:push`

### Step 2: Seed data

Create a seed script at `src/db/seed-groups.ts` (runnable via `bun run db:seed-groups` added to package.json). The seed should create a realistic hierarchy:

**Fake primary/secondary school owner:**

- School owner: `fc:org:sunnvik.kommune.no` — "Sunnvik kommune" (type: `primary_and_lower_secondary_owner`)
  - School: `fc:org:sunnvik.kommune.no:unit:NO895395126` — "Elgskinnets skole"
    - 3 basis groups (e.g. "1A", "2A", "3A") with `go_type: "b"`
    - 3 teaching groups (e.g. "Matte 1A", "Norsk 2A", "Engelsk 3A") with `go_type: "u"` and `grep` data
    - 1 other group with `go_type: "a"`
  - School: `fc:org:sunnvik.kommune.no:unit:NO895395127` — "Fjelltoppen ungdomsskole"
    - 2 basis groups, 2 teaching groups

**Fake higher education institution:**

- Organization: `fc:org:eksempeluniversitetet.no` — "Eksempeluniversitetet" (type: `higher_education`)
  - Org unit: `fc:org:eksempeluniversitetet.no:unit:IFI` — "Institutt for informatikk"
  - Org unit: `fc:org:eksempeluniversitetet.no:unit:MAT` — "Matematisk institutt"
  - Program: `fc:fs:fs:prg:eksempeluniversitetet.no:BINFO` — "Bachelor i informatikk"
    - Cohort: `fc:fs:fs:kull:eksempeluniversitetet.no:BINFO:2024H`
      - Class: `fc:fs:fs:klasse:eksempeluniversitetet.no:BINFO:2024H:A`
  - Course: `fc:fs:fs:emne:eksempeluniversitetet.no:IN1000:1` — "Introduksjon til programmering"
  - Course: `fc:fs:fs:emne:eksempeluniversitetet.no:MAT1100:1` — "Kalkulus"
  - Field of study: `fc:fs:fs:str:eksempeluniversitetet.no:KS` — "Kompliserte studier"

**Grep entries:**

- `fc:grep:MAT0009` — "Matematikk fellesfag" (`fagkoder`)
- `fc:grep:NOR0009` — "Norsk" (`fagkoder`)
- `fc:grep:ENG0009` — "Engelsk" (`fagkoder`)

**Ad hoc groups:**

- 2 ad-hoc groups with UUIDs, one public and one private

**Fake users and memberships:**

- 10 students spread across schools and university
- 3 teachers/faculty assigned as `admin` in education groups and `owner` in FS groups
- 1 ad-hoc group owner

All dates should use the current school year (August 2025 – June 2026) for `notBefore`/`notAfter`.

### Step 3: Route setup

1. Add `groups-api.fakefeide.no` custom domain in `wrangler.jsonc`
2. Add a URL rewrite in `src/router.tsx` for the `groups-api` subdomain → `/api/groups`
3. Create a catch-all route at `src/routes/api/groups/$.ts` with a `withGroupsBasePath` request rewriter (same pattern as the auth catch-all)

### Step 4: API handler

Create a Groups API handler at `src/lib/groups-api.ts`. This is a standalone request handler (not Better Auth) that:

1. Parses the path to determine which endpoint was hit
2. Validates the OAuth token by calling Better Auth's token introspection or session API
3. Queries the database via Drizzle
4. Assembles the response JSON, merging the `extra` JSON fields into the group/membership objects
5. Handles pagination (cursor-based with `Link` header) for org group listings
6. Returns proper error codes (403, 404)

The handler should be a function `handleGroupsRequest(request: Request): Promise<Response>` that the catch-all route delegates to.

### Step 5: Endpoint implementation order

Implement in this order (each builds on the previous):

1. `GET /grouptypes` — simplest, just returns the static list
2. `GET /groups/{groupid}` — single group lookup by id
3. `GET /me/groups` — user's groups (requires token → user resolution)
4. `GET /me/groups/{groupid}` — user's membership in specific group
5. `GET /groups/{groupid}/members` — group member listing
6. `GET /groups` — list/query groups
7. `GET /v1/orgs/{domain}/groups` — org group listing with pagination and filters
8. `GET /v1/orgs/{domain}/groups/{groupid}` — org group details
9. `GET /v1/orgs/{domain}/groups/{groupid}/members` — org group members with affiliation filter

### Step 6: Token validation

The Groups API needs to validate OAuth tokens issued by the FakeFeide auth server:

- **User-bound tokens**: Call the Better Auth introspection endpoint (`/api/auth/oauth2/introspect`) to get the user identity and scopes
- **Client credentials tokens**: Same introspection, but verify the `system-all-users` scope for org endpoints
- Extract the user ID from the token to query group memberships

### Step 7: Member response format

When returning group members, the response includes user info alongside membership:

```json
{
	"name": "Alf Berg",
	"userid_sec": ["feide:aberg04@elgskinnetskole.sunnvik.kommune.no"],
	"membership": {
		"basic": "member",
		"affiliation": "student",
		"displayName": { "nb": "Elev" }
	}
}
```

This means the member listing needs to join with the user table to get `name` and construct `userid_sec` from the user's email/feide ID.

---

## 6. Files to create/modify

| File                         | Action | Purpose                                            |
| ---------------------------- | ------ | -------------------------------------------------- |
| `src/db/schema.ts`           | modify | Add `groups` and `groupMemberships` tables         |
| `src/db/seed-groups.ts`      | create | Seed script with fake hierarchy                    |
| `src/lib/groups-api.ts`      | create | Request handler with routing, auth, and DB queries |
| `src/routes/api/groups/$.ts` | create | Catch-all route delegating to groups handler       |
| `src/router.tsx`             | modify | Add `groups-api` subdomain rewrite                 |
| `wrangler.jsonc`             | modify | Add `groups-api.fakefeide.no` custom domain        |
| `package.json`               | modify | Add `db:seed-groups` script                        |

---

## 7. URL encoding

Group IDs in URL paths must be percent-encoded per RFC 3986. The handler must `decodeURIComponent` the `{groupid}` path parameter before querying the database. Characters that don't need encoding: `A-Za-z0-9-._~:`.

---

## 8. CORS

All endpoints should return:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET
```
