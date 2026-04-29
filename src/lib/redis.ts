import { Redis } from "ioredis";
import RedisMock from "ioredis-mock";
import { getEnv } from "#/env";

let cached: Redis | undefined;

export function getRedis(): Redis {
	if (cached) return cached;

	const env = getEnv();
	cached = env.REDIS_CONNECTION_URL ? new Redis(env.REDIS_CONNECTION_URL) : new RedisMock();
	return cached;
}
