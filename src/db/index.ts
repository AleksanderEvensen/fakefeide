import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client/web";
import { getEnv } from "#/env";

import * as schema from "./schema.ts";

const env = getEnv();

const turso = createClient({
	url: env.TURSO_DATABASE_URL,
	authToken: env.TURSO_DATABASE_AUTH_TOKEN,
});

export const db = drizzle(turso, { schema });
