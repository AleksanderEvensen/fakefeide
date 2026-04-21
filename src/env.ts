type EnvVars = {
	BETTER_AUTH_URL: string;
	BETTER_AUTH_SECRET: string;
	TURSO_DATABASE_URL: string;
	TURSO_DATABASE_AUTH_TOKEN: string;
	ADMIN_PASSWORD: string;
};

let cached: EnvVars | undefined;

function loadFromProcess(): EnvVars {
	return {
		BETTER_AUTH_URL: process.env.BETTER_AUTH_URL!,
		BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
		TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL!,
		TURSO_DATABASE_AUTH_TOKEN: process.env.TURSO_DATABASE_AUTH_TOKEN!,
		ADMIN_PASSWORD: process.env.ADMIN_PASSWORD!,
	};
}

export function getEnv(): EnvVars {
	if (cached) return cached;

	cached = loadFromProcess();
	return cached;
}
