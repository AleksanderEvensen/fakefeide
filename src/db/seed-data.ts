// Shared seed data — imported by both the seed script and the frontend quick-login UI.

export type UserRole = "student" | "teacher" | "faculty" | "admin";

export interface SeedUser {
	key: string;
	name: string;
	email: string;
	role: UserRole;
	institution: string;
	/** Extra context shown in the quick-login UI (e.g. class name) */
	detail?: string;
}

export const SEED_PASSWORD = "password123";

export const SEED_USERS: SeedUser[] = [
	// ── Elgskinnet students — class 1A (main classroom) ─────────────────
	{
		key: "alf",
		name: "Alf Berg",
		email: "alf.berg@elgskinnetskole.sunnvik.kommune.no",
		role: "student",
		institution: "Elgskinnets skole",
		detail: "1A",
	},
	{
		key: "britt",
		name: "Britt Dahle",
		email: "britt.dahle@elgskinnetskole.sunnvik.kommune.no",
		role: "student",
		institution: "Elgskinnets skole",
		detail: "1A",
	},
	{
		key: "carl",
		name: "Carl Eriksen",
		email: "carl.eriksen@elgskinnetskole.sunnvik.kommune.no",
		role: "student",
		institution: "Elgskinnets skole",
		detail: "1A",
	},
	{
		key: "dina",
		name: "Dina Fjeld",
		email: "dina.fjeld@elgskinnetskole.sunnvik.kommune.no",
		role: "student",
		institution: "Elgskinnets skole",
		detail: "1A",
	},
	{
		key: "erik",
		name: "Erik Gronn",
		email: "erik.gronn@elgskinnetskole.sunnvik.kommune.no",
		role: "student",
		institution: "Elgskinnets skole",
		detail: "1A",
	},
	{
		key: "fiona",
		name: "Fiona Haugen",
		email: "fiona.haugen@elgskinnetskole.sunnvik.kommune.no",
		role: "student",
		institution: "Elgskinnets skole",
		detail: "1A",
	},
	// ── Elgskinnet students — class 2A ──────────────────────────────────
	{
		key: "gustav",
		name: "Gustav Iversen",
		email: "gustav.iversen@elgskinnetskole.sunnvik.kommune.no",
		role: "student",
		institution: "Elgskinnets skole",
		detail: "2A",
	},
	{
		key: "hanna",
		name: "Hanna Johansen",
		email: "hanna.johansen@elgskinnetskole.sunnvik.kommune.no",
		role: "student",
		institution: "Elgskinnets skole",
		detail: "2A",
	},

	// ── Elgskinnet teachers ─────────────────────────────────────────────
	{
		key: "kari",
		name: "Kari Nordmann",
		email: "kari.nordmann@elgskinnetskole.sunnvik.kommune.no",
		role: "teacher",
		institution: "Elgskinnets skole",
		detail: "Matte",
	},
	{
		key: "lars",
		name: "Lars Olsen",
		email: "lars.olsen@elgskinnetskole.sunnvik.kommune.no",
		role: "teacher",
		institution: "Elgskinnets skole",
		detail: "Norsk",
	},
	{
		key: "marte",
		name: "Marte Pedersen",
		email: "marte.pedersen@elgskinnetskole.sunnvik.kommune.no",
		role: "teacher",
		institution: "Elgskinnets skole",
		detail: "Engelsk",
	},

	// ── University students ─────────────────────────────────────────────
	{
		key: "isak",
		name: "Isak Knutsen",
		email: "isak.knutsen@eksempeluniversitetet.no",
		role: "student",
		institution: "Eksempeluniversitetet",
		detail: "IN1000",
	},
	{
		key: "julie",
		name: "Julie Larsen",
		email: "julie.larsen@eksempeluniversitetet.no",
		role: "student",
		institution: "Eksempeluniversitetet",
		detail: "IN1000",
	},

	// ── University faculty ──────────────────────────────────────────────
	{
		key: "ole",
		name: "Ole Vangen",
		email: "ole.vangen@eksempeluniversitetet.no",
		role: "faculty",
		institution: "Eksempeluniversitetet",
		detail: "IN1000",
	},

	// ── Admin ───────────────────────────────────────────────────────────
	{
		key: "nils",
		name: "Nils Svendsen",
		email: "nils.svendsen@sunnvik.kommune.no",
		role: "admin",
		institution: "Sunnvik kommune",
	},
];

export const INSTITUTIONS = [...new Set(SEED_USERS.map((u) => u.institution))];
export const ROLES: UserRole[] = ["student", "teacher", "faculty", "admin"];
