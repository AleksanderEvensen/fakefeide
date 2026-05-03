import { writeFileSync } from "node:fs";
import { db } from "#/db";
import * as schema from "./schema.ts";

async function backup() {
	const clients = await db.select().from(schema.oauthClient);
	const path = "oauth-clients-backup.json";
	writeFileSync(path, JSON.stringify(clients, null, 2));
	console.log(`Backed up ${clients.length} oauth client(s) to ${path}`);
}

backup().catch((err) => {
	console.error("Backup failed:", err);
	process.exit(1);
});
