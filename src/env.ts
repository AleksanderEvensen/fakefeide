type EnvVars = {
	BETTER_AUTH_URL: string;
	BETTER_AUTH_SECRET: string;
	TURSO_DATABASE_URL: string;
	TURSO_DATABASE_AUTH_TOKEN: string;
	ADMIN_PASSWORD: string;
	REDIS_CONNECTION_URL: string | undefined;
};

let cached: EnvVars | undefined;

function loadFromProcess(): EnvVars {
	return {
		BETTER_AUTH_URL: process.env.BETTER_AUTH_URL!,
		BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
		TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL!,
		TURSO_DATABASE_AUTH_TOKEN: process.env.TURSO_DATABASE_AUTH_TOKEN!,
		ADMIN_PASSWORD: process.env.ADMIN_PASSWORD!,
		REDIS_CONNECTION_URL: process.env.REDIS_CONNECTION_URL,
	};
}

export function getEnv(): EnvVars {
	if (cached) return cached;

	cached = loadFromProcess();
	return cached;
}
