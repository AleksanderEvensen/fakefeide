import { getEnv } from "#/env";
import { getCookie, removeCookie, setCookie } from "#/lib/cookies";

const COOKIE_NAME = "ff_admin";
const COOKIE_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let mismatch = 0;
	for (let i = 0; i < a.length; i++) {
		mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return mismatch === 0;
}

export function isAdminAuthenticated(): boolean {
	const env = getEnv();
	if (!env.ADMIN_PASSWORD) return false;
	const cookie = getCookie(COOKIE_NAME);
	return !!cookie && timingSafeEqual(cookie, env.ADMIN_PASSWORD);
}

export function requireAdmin() {
	if (!isAdminAuthenticated()) {
		throw new Error("unauthorized");
	}
}

export function setAdminCookie(value: string) {
	setCookie(COOKIE_NAME, value, COOKIE_DURATION_MS, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
	});
}

export function clearAdminCookie() {
	removeCookie(COOKIE_NAME);
}

export function randomId(bytes = 16): string {
	const buf = new Uint8Array(bytes);
	crypto.getRandomValues(buf);
	let binary = "";
	for (const b of buf) binary += String.fromCharCode(b);
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function parseRedirectUris(input: unknown): string[] {
	if (!Array.isArray(input)) return [];
	const out: string[] = [];
	for (const v of input) {
		if (typeof v !== "string") continue;
		const trimmed = v.trim();
		if (!trimmed) continue;
		try {
			new URL(trimmed);
			out.push(trimmed);
		} catch {
			// skip invalid URL
		}
	}
	return out;
}
