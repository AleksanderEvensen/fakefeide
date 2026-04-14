import { inArray } from "drizzle-orm";
import { auth } from "#/lib/auth";
import { db } from "#/db";
import * as schema from "./schema.ts";
import { SEED_USERS, SEED_PASSWORD } from "./seed-data.ts";

const { groups, groupMemberships, user, account } = schema;

// Populated during seed — maps user keys to their real IDs assigned by Better Auth
const USER = {} as Record<string, string>;

// ── Group IDs ───────────────────────────────────────────────────────────

const G = {
	// School owner
	sunnvik: "fc:org:sunnvik.kommune.no",

	// School — Elgskinnets skole
	elgskinnet: "fc:org:sunnvik.kommune.no:unit:NO895395126",

	// Elgskinnet basis groups
	elk1A: "fc:gogroup:sunnvik.kommune.no:b:NO895395126:1A:2025-08-18:2026-06-20",
	elk2A: "fc:gogroup:sunnvik.kommune.no:b:NO895395126:2A:2025-08-18:2026-06-20",
	elk3A: "fc:gogroup:sunnvik.kommune.no:b:NO895395126:3A:2025-08-18:2026-06-20",

	// Elgskinnet teaching groups
	elkMatte1A: "fc:gogroup:sunnvik.kommune.no:u:NO895395126:MATTE1A:2025-08-18:2026-06-20",
	elkNorsk1A: "fc:gogroup:sunnvik.kommune.no:u:NO895395126:NORSK1A:2025-08-18:2026-06-20",
	elkEng1A: "fc:gogroup:sunnvik.kommune.no:u:NO895395126:ENG1A:2025-08-18:2026-06-20",
	elkMatte2A: "fc:gogroup:sunnvik.kommune.no:u:NO895395126:MATTE2A:2025-08-18:2026-06-20",

	// Elgskinnet other
	elkElevraad: "fc:gogroup:sunnvik.kommune.no:a:NO895395126:ELEVRAAD:2025-08-18:2026-06-20",

	// School — Fjelltoppen ungdomsskole
	fjelltoppen: "fc:org:sunnvik.kommune.no:unit:NO895395127",

	// Fjelltoppen basis groups
	fjell8A: "fc:gogroup:sunnvik.kommune.no:b:NO895395127:8A:2025-08-18:2026-06-20",
	fjell9A: "fc:gogroup:sunnvik.kommune.no:b:NO895395127:9A:2025-08-18:2026-06-20",

	// Fjelltoppen teaching groups
	fjellMatte8A: "fc:gogroup:sunnvik.kommune.no:u:NO895395127:MATTE8A:2025-08-18:2026-06-20",
	fjellNorsk9A: "fc:gogroup:sunnvik.kommune.no:u:NO895395127:NORSK9A:2025-08-18:2026-06-20",

	// University
	eku: "fc:org:eksempeluniversitetet.no",
	ifi: "fc:org:eksempeluniversitetet.no:unit:IFI",
	mat: "fc:org:eksempeluniversitetet.no:unit:MAT",

	// Program / cohort / class
	binfo: "fc:fs:fs:prg:eksempeluniversitetet.no:BINFO",
	binfo2024H: "fc:fs:fs:kull:eksempeluniversitetet.no:BINFO:2024H",
	binfo2024HA: "fc:fs:fs:klasse:eksempeluniversitetet.no:BINFO:2024H:A",

	// Courses
	in1000: "fc:fs:fs:emne:eksempeluniversitetet.no:IN1000:1",
	mat1100: "fc:fs:fs:emne:eksempeluniversitetet.no:MAT1100:1",

	// Field of study
	ks: "fc:fs:fs:str:eksempeluniversitetet.no:KS",

	// Grep
	grepMat: "fc:grep:MAT0009",
	grepNor: "fc:grep:NOR0009",
	grepEng: "fc:grep:ENG0009",

	// Ad hoc
	adHocAlpha: "voot:ad-hoc:550e8400-e29b-41d4-a716-446655440000",
	adHocBeta: "voot:ad-hoc:550e8400-e29b-41d4-a716-446655440001",
} as const;

// ── Helper ──────────────────────────────────────────────────────────────

const j = (obj: unknown) => JSON.stringify(obj);

// ── Seed data ───────────────────────────────────────────────────────────

const NB = "2025-08-18";
const NA = "2026-06-20";

const basisExtra = j({ go_type: "b", go_type_displayName: "basisgruppe" });
const otherExtra = j({ go_type: "a", go_type_displayName: "andre grupper" });

function teachingExtra(displayName: string, code: string) {
	return j({
		go_type: "u",
		go_type_displayName: "undervisningsgruppe",
		grep: { displayName, code },
	});
}

const allGroups: (typeof groups.$inferInsert)[] = [
	// ── School owner ────────────────────────────────────────────────────
	{
		id: G.sunnvik,
		type: "fc:org",
		displayName: "Sunnvik kommune",
		public: false,
		extra: j({
			orgType: ["primary_and_lower_secondary_owner"],
			eduOrgLegalName: "Sunnvik kommune",
			norEduOrgNIN: "NO895395125",
			mail: "post@sunnvik.kommune.no",
		}),
	},

	// ── Elgskinnets skole ───────────────────────────────────────────────
	{
		id: G.elgskinnet,
		type: "fc:org",
		displayName: "Elgskinnets skole",
		parentId: G.sunnvik,
		extra: j({ orgType: ["primary_and_lower_secondary"] }),
	},
	// Basis groups
	{ id: G.elk1A, type: "fc:gogroup", displayName: "1A", parentId: G.elgskinnet, notBefore: NB, notAfter: NA, extra: basisExtra },
	{ id: G.elk2A, type: "fc:gogroup", displayName: "2A", parentId: G.elgskinnet, notBefore: NB, notAfter: NA, extra: basisExtra },
	{ id: G.elk3A, type: "fc:gogroup", displayName: "3A", parentId: G.elgskinnet, notBefore: NB, notAfter: NA, extra: basisExtra },
	// Teaching groups
	{ id: G.elkMatte1A, type: "fc:gogroup", displayName: "Matte 1A", parentId: G.elgskinnet, notBefore: NB, notAfter: NA, extra: teachingExtra("Matematikk fellesfag", "MAT0009") },
	{ id: G.elkNorsk1A, type: "fc:gogroup", displayName: "Norsk 1A", parentId: G.elgskinnet, notBefore: NB, notAfter: NA, extra: teachingExtra("Norsk", "NOR0009") },
	{ id: G.elkEng1A, type: "fc:gogroup", displayName: "Engelsk 1A", parentId: G.elgskinnet, notBefore: NB, notAfter: NA, extra: teachingExtra("Engelsk", "ENG0009") },
	{ id: G.elkMatte2A, type: "fc:gogroup", displayName: "Matte 2A", parentId: G.elgskinnet, notBefore: NB, notAfter: NA, extra: teachingExtra("Matematikk fellesfag", "MAT0009") },
	// Other
	{ id: G.elkElevraad, type: "fc:gogroup", displayName: "Elevrådet", parentId: G.elgskinnet, notBefore: NB, notAfter: NA, extra: otherExtra },

	// ── Fjelltoppen ungdomsskole ─────────────────────────────────────────
	{
		id: G.fjelltoppen,
		type: "fc:org",
		displayName: "Fjelltoppen ungdomsskole",
		parentId: G.sunnvik,
		extra: j({ orgType: ["primary_and_lower_secondary"] }),
	},
	// Basis groups
	{ id: G.fjell8A, type: "fc:gogroup", displayName: "8A", parentId: G.fjelltoppen, notBefore: NB, notAfter: NA, extra: basisExtra },
	{ id: G.fjell9A, type: "fc:gogroup", displayName: "9A", parentId: G.fjelltoppen, notBefore: NB, notAfter: NA, extra: basisExtra },
	// Teaching groups
	{ id: G.fjellMatte8A, type: "fc:gogroup", displayName: "Matte 8A", parentId: G.fjelltoppen, notBefore: NB, notAfter: NA, extra: teachingExtra("Matematikk fellesfag", "MAT0009") },
	{ id: G.fjellNorsk9A, type: "fc:gogroup", displayName: "Norsk 9A", parentId: G.fjelltoppen, notBefore: NB, notAfter: NA, extra: teachingExtra("Norsk", "NOR0009") },

	// ── University ──────────────────────────────────────────────────────
	{
		id: G.eku,
		type: "fc:org",
		displayName: "Eksempeluniversitetet",
		extra: j({
			orgType: ["higher_education"],
			eduOrgLegalName: "Eksempeluniversitetet",
			norEduOrgNIN: "NO999888777",
			mail: "post@eksempeluniversitetet.no",
			norEduOrgAcronym: "EKU",
		}),
	},
	// Org units
	{ id: G.ifi, type: "fc:orgunit", displayName: "Institutt for informatikk", parentId: G.eku },
	{ id: G.mat, type: "fc:orgunit", displayName: "Matematisk institutt", parentId: G.eku },

	// Program
	{ id: G.binfo, type: "fc:fs:prg", displayName: "Bachelor i informatikk", parentId: G.eku },
	// Cohort
	{ id: G.binfo2024H, type: "fc:fs:prg", displayName: "Kull 2024 Høst", parentId: G.binfo },
	// Class
	{ id: G.binfo2024HA, type: "fc:fs:klasse", displayName: "Klasse A", parentId: G.binfo2024H },

	// Courses
	{ id: G.in1000, type: "fc:fs:emne", displayName: "Introduksjon til programmering", parentId: G.eku },
	{ id: G.mat1100, type: "fc:fs:emne", displayName: "Kalkulus", parentId: G.eku },

	// Field of study
	{ id: G.ks, type: "fc:fs:str", displayName: "Kompliserte studier", parentId: G.eku },

	// ── Grep entries ────────────────────────────────────────────────────
	{ id: G.grepMat, type: "fc:grep", displayName: "Matematikk fellesfag", public: true, extra: j({ grep_type: "fagkoder", code: "MAT0009" }) },
	{ id: G.grepNor, type: "fc:grep", displayName: "Norsk", public: true, extra: j({ grep_type: "fagkoder", code: "NOR0009" }) },
	{ id: G.grepEng, type: "fc:grep", displayName: "Engelsk", public: true, extra: j({ grep_type: "fagkoder", code: "ENG0009" }) },

	// ── Ad hoc groups ───────────────────────────────────────────────────
	{ id: G.adHocAlpha, type: "voot:ad-hoc", displayName: "Prosjektgruppe Alpha", public: true, extra: j({ description: "Tverrfaglig prosjektgruppe" }) },
	{ id: G.adHocBeta, type: "voot:ad-hoc", displayName: "Lesegruppe Beta", public: false, extra: j({ description: "Uformell lesegruppe" }) },
];


// ── Memberships ─────────────────────────────────────────────────────────

const studentOrgExtra = j({ displayName: "Elev", affiliation: ["member", "student"], primaryAffiliation: "student" });
const studentSchoolExtra = j({ primarySchool: true });
const studentBasisExtra = j({ affiliation: "student", displayName: { nb: "Elev" } });
const studentTeachingExtra = j({ affiliation: "student", displayName: { nb: "Elev" } });

const teacherOrgExtra = j({ displayName: "Lærer", affiliation: ["member", "employee", "faculty"], primaryAffiliation: "faculty" });
const teacherBasisExtra = j({ affiliation: "faculty", displayName: { nb: "Lærer" } });
const teacherTeachingExtra = j({ affiliation: "faculty", displayName: { nb: "Lærer" } });

const studentUniOrgExtra = j({ displayName: "Student", affiliation: ["member", "student"], primaryAffiliation: "student" });
const studentUniUnitExtra = j({ primaryOrgUnit: true });
const studentProgramExtra = j({ active: true, displayName: "Student", fsroles: ["STUDENT"] });
const studentCourseExtra = j({ active: true, displayName: "Student", fsroles: ["STUDENT"], subjectRelations: "undervisning" });

const facultyUniOrgExtra = j({ displayName: "Førsteamanuensis", affiliation: ["member", "employee", "faculty"], primaryAffiliation: "faculty", title: ["Førsteamanuensis"] });
const facultyCourseExtra = j({ active: true, displayName: "Foreleser", fsroles: ["LÆRER"] });

const adminOrgExtra = j({ displayName: "Administrator", affiliation: ["member", "employee"], primaryAffiliation: "employee" });

type Membership = typeof groupMemberships.$inferInsert;

function buildMemberships(): Membership[] {
	const class1A = [USER.alf, USER.britt, USER.carl, USER.dina, USER.erik, USER.fiona];
	const class2A = [USER.gustav, USER.hanna];
	const class3A = [USER.alf]; // Alf also in 3A (double-enrolled for variety)
	const allElkStudents = [...class1A, ...class2A];
	const elkTeachers = [USER.kari, USER.lars, USER.marte];

	return [
		// ── Elgskinnet students — org memberships ───────────────────────
		...allElkStudents.flatMap((uid) => [
			{ groupId: G.sunnvik, userId: uid, basic: "member" as const, extra: studentOrgExtra },
			{ groupId: G.elgskinnet, userId: uid, basic: "member" as const, extra: studentSchoolExtra },
		]),

		// ── Class 1A — basis group (6 students) ─────────────────────────
		...class1A.map((uid) => ({
			groupId: G.elk1A, userId: uid, basic: "member" as const, extra: studentBasisExtra,
		})),
		// All 1A students in all three teaching groups
		...class1A.flatMap((uid) => [
			{ groupId: G.elkMatte1A, userId: uid, basic: "member" as const, extra: studentTeachingExtra },
			{ groupId: G.elkNorsk1A, userId: uid, basic: "member" as const, extra: studentTeachingExtra },
			{ groupId: G.elkEng1A, userId: uid, basic: "member" as const, extra: studentTeachingExtra },
		]),

		// ── Class 2A — basis group (2 students) ─────────────────────────
		...class2A.map((uid) => ({
			groupId: G.elk2A, userId: uid, basic: "member" as const, extra: studentBasisExtra,
		})),
		...class2A.map((uid) => ({
			groupId: G.elkMatte2A, userId: uid, basic: "member" as const, extra: studentTeachingExtra,
		})),

		// ── Class 3A — basis group ──────────────────────────────────────
		...class3A.map((uid) => ({
			groupId: G.elk3A, userId: uid, basic: "member" as const, extra: studentBasisExtra,
		})),

		// Alf in Elevrådet
		{ groupId: G.elkElevraad, userId: USER.alf, basic: "member" },

		// ── Elgskinnet teachers — org memberships ───────────────────────
		...elkTeachers.flatMap((uid) => [
			{ groupId: G.sunnvik, userId: uid, basic: "admin" as const, extra: teacherOrgExtra },
			{ groupId: G.elgskinnet, userId: uid, basic: "member" as const, extra: studentSchoolExtra },
		]),

		// Kari teaches Matte 1A + 2A
		{ groupId: G.elk1A, userId: USER.kari, basic: "admin", extra: teacherBasisExtra },
		{ groupId: G.elk2A, userId: USER.kari, basic: "admin", extra: teacherBasisExtra },
		{ groupId: G.elkMatte1A, userId: USER.kari, basic: "admin", extra: teacherTeachingExtra },
		{ groupId: G.elkMatte2A, userId: USER.kari, basic: "admin", extra: teacherTeachingExtra },

		// Lars teaches Norsk 1A
		{ groupId: G.elk1A, userId: USER.lars, basic: "admin", extra: teacherBasisExtra },
		{ groupId: G.elkNorsk1A, userId: USER.lars, basic: "admin", extra: teacherTeachingExtra },

		// Marte teaches Engelsk 1A
		{ groupId: G.elk1A, userId: USER.marte, basic: "admin", extra: teacherBasisExtra },
		{ groupId: G.elkEng1A, userId: USER.marte, basic: "admin", extra: teacherTeachingExtra },
		{ groupId: G.elkElevraad, userId: USER.marte, basic: "admin", extra: teacherTeachingExtra },

		// ── Fjelltoppen students (reuse Gustav and Hanna for some cross-enrollment) ──
		// Fjelltoppen teachers — Kari also teaches at Fjelltoppen
		{ groupId: G.fjelltoppen, userId: USER.kari, basic: "member", extra: studentSchoolExtra },
		{ groupId: G.fjell8A, userId: USER.kari, basic: "admin", extra: teacherBasisExtra },
		{ groupId: G.fjellMatte8A, userId: USER.kari, basic: "admin", extra: teacherTeachingExtra },
		{ groupId: G.fjell9A, userId: USER.lars, basic: "admin", extra: teacherBasisExtra },
		{ groupId: G.fjellNorsk9A, userId: USER.lars, basic: "admin", extra: teacherTeachingExtra },

		// ── University students (Isak, Julie) ───────────────────────────
		...[USER.isak, USER.julie].flatMap((uid) => [
			{ groupId: G.eku, userId: uid, basic: "member" as const, extra: studentUniOrgExtra },
			{ groupId: G.ifi, userId: uid, basic: "member" as const, extra: studentUniUnitExtra },
			{ groupId: G.binfo, userId: uid, basic: "member" as const, extra: studentProgramExtra },
			{ groupId: G.binfo2024H, userId: uid, basic: "member" as const },
			{ groupId: G.binfo2024HA, userId: uid, basic: "member" as const },
			{ groupId: G.in1000, userId: uid, basic: "member" as const, extra: studentCourseExtra },
			{ groupId: G.mat1100, userId: uid, basic: "member" as const, extra: studentCourseExtra },
			{ groupId: G.ks, userId: uid, basic: "member" as const },
		]),

		// ── Faculty Ole → University ────────────────────────────────────
		{ groupId: G.eku, userId: USER.ole, basic: "admin", extra: facultyUniOrgExtra },
		{ groupId: G.ifi, userId: USER.ole, basic: "member", extra: studentUniUnitExtra },
		{ groupId: G.in1000, userId: USER.ole, basic: "owner", extra: facultyCourseExtra },
		{ groupId: G.mat1100, userId: USER.ole, basic: "owner", extra: facultyCourseExtra },

		// ── Admin Nils → School owner ───────────────────────────────────
		{ groupId: G.sunnvik, userId: USER.nils, basic: "admin", extra: adminOrgExtra },

		// ── Ad hoc groups ───────────────────────────────────────────────
		{ groupId: G.adHocAlpha, userId: USER.isak, basic: "owner" },
		{ groupId: G.adHocAlpha, userId: USER.julie, basic: "member" },
		{ groupId: G.adHocBeta, userId: USER.ole, basic: "owner" },
		{ groupId: G.adHocBeta, userId: USER.isak, basic: "member" },
	];
}

// ── Run seed ────────────────────────────────────────────────────────────

async function seed() {
	console.log("Seeding groups data...");

	// 1. Clear existing data (order matters for FK constraints)
	console.log("  Clearing existing data...");
	await db.delete(groupMemberships);
	await db.delete(groups);
	// Delete seed users by email
	const seedEmails = SEED_USERS.map((u) => u.email);
	const existingUsers = await db.select({ id: user.id }).from(user).where(inArray(user.email, seedEmails));
	const existingUserIds = existingUsers.map((u) => u.id);
	if (existingUserIds.length > 0) {
		await db.delete(account).where(inArray(account.userId, existingUserIds));
		await db.delete(user).where(inArray(user.id, existingUserIds));
	}

	// 2. Insert groups (parents first — array order satisfies FK constraints)
	console.log("  Inserting groups...");
	for (const g of allGroups) {
		await db.insert(groups).values(g);
	}

	// 3. Create users via Better Auth (ensures password hashing matches sign-in)
	console.log("  Creating users via Better Auth...");
	for (const u of SEED_USERS) {
		const result = await auth.api.signUpEmail({
			body: { name: u.name, email: u.email, password: SEED_PASSWORD },
		});
		USER[u.key] = result.user.id;
	}

	// 4. Insert memberships (built after users exist so USER IDs are resolved)
	console.log("  Inserting memberships...");
	const allMemberships = buildMemberships();
	const BATCH_SIZE = 20;
	for (let i = 0; i < allMemberships.length; i += BATCH_SIZE) {
		const batch = allMemberships.slice(i, i + BATCH_SIZE);
		await db.insert(groupMemberships).values(batch);
	}

	console.log(`Done! Inserted ${allGroups.length} groups, ${SEED_USERS.length} users, ${allMemberships.length} memberships.`);
}

seed().catch((err) => {
	console.error("Seed failed:", err);
	process.exit(1);
});
