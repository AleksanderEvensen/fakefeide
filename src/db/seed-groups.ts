import { inArray } from "drizzle-orm";
import { auth } from "#/lib/auth";
import { db } from "#/db";
import * as schema from "./schema.ts";

const { groups, groupMemberships, user, account } = schema;

// ── User keys (resolved to real IDs after signup) ──────────────────────

type UserKey = "alf" | "britt" | "carl" | "dina" | "erik" | "fiona" | "gustav" | "hanna" | "isak" | "julie" | "kari" | "lars" | "marte" | "nils";

const SEED_USERS: { key: UserKey; name: string; email: string }[] = [
	{ key: "alf", name: "Alf Berg", email: "alf.berg@elgskinnetskole.sunnvik.kommune.no" },
	{ key: "britt", name: "Britt Dahle", email: "britt.dahle@elgskinnetskole.sunnvik.kommune.no" },
	{ key: "carl", name: "Carl Eriksen", email: "carl.eriksen@elgskinnetskole.sunnvik.kommune.no" },
	{ key: "dina", name: "Dina Fjeld", email: "dina.fjeld@elgskinnetskole.sunnvik.kommune.no" },
	{ key: "erik", name: "Erik Grønn", email: "erik.gronn@fjelltoppenungdomsskole.sunnvik.kommune.no" },
	{ key: "fiona", name: "Fiona Haugen", email: "fiona.haugen@fjelltoppenungdomsskole.sunnvik.kommune.no" },
	{ key: "gustav", name: "Gustav Iversen", email: "gustav.iversen@eksempeluniversitetet.no" },
	{ key: "hanna", name: "Hanna Johansen", email: "hanna.johansen@eksempeluniversitetet.no" },
	{ key: "isak", name: "Isak Knutsen", email: "isak.knutsen@eksempeluniversitetet.no" },
	{ key: "julie", name: "Julie Larsen", email: "julie.larsen@eksempeluniversitetet.no" },
	{ key: "kari", name: "Kari Nordmann", email: "kari.nordmann@elgskinnetskole.sunnvik.kommune.no" },
	{ key: "lars", name: "Lars Olsen", email: "lars.olsen@fjelltoppenungdomsskole.sunnvik.kommune.no" },
	{ key: "marte", name: "Marte Pedersen", email: "marte.pedersen@eksempeluniversitetet.no" },
	{ key: "nils", name: "Nils Svendsen", email: "nils.svendsen@sunnvik.kommune.no" },
];

const SEED_PASSWORD = "password123";

// Populated during seed — maps user keys to their real IDs assigned by Better Auth
const USER = {} as Record<UserKey, string>;

// ── Group IDs ───────────────────────────────────────────────────────────

const G = {
	// School owner
	sunnvik: "fc:org:sunnvik.kommune.no",

	// Schools
	elgskinnet: "fc:org:sunnvik.kommune.no:unit:NO895395126",
	fjelltoppen: "fc:org:sunnvik.kommune.no:unit:NO895395127",

	// Elgskinnet basis groups
	elk1A: "fc:gogroup:sunnvik.kommune.no:b:NO895395126:1A:2025-08-18:2026-06-20",
	elk2A: "fc:gogroup:sunnvik.kommune.no:b:NO895395126:2A:2025-08-18:2026-06-20",
	elk3A: "fc:gogroup:sunnvik.kommune.no:b:NO895395126:3A:2025-08-18:2026-06-20",

	// Elgskinnet teaching groups
	elkMatte1A: "fc:gogroup:sunnvik.kommune.no:u:NO895395126:MATTE1A:2025-08-18:2026-06-20",
	elkNorsk2A: "fc:gogroup:sunnvik.kommune.no:u:NO895395126:NORSK2A:2025-08-18:2026-06-20",
	elkEng3A: "fc:gogroup:sunnvik.kommune.no:u:NO895395126:ENG3A:2025-08-18:2026-06-20",

	// Elgskinnet other
	elkElevraad: "fc:gogroup:sunnvik.kommune.no:a:NO895395126:ELEVRAAD:2025-08-18:2026-06-20",

	// Fjelltoppen basis groups
	fjl8A: "fc:gogroup:sunnvik.kommune.no:b:NO895395127:8A:2025-08-18:2026-06-20",
	fjl9A: "fc:gogroup:sunnvik.kommune.no:b:NO895395127:9A:2025-08-18:2026-06-20",

	// Fjelltoppen teaching groups
	fjlMatte8A: "fc:gogroup:sunnvik.kommune.no:u:NO895395127:MATTE8A:2025-08-18:2026-06-20",
	fjlNorsk9A: "fc:gogroup:sunnvik.kommune.no:u:NO895395127:NORSK9A:2025-08-18:2026-06-20",

	// University
	eku: "fc:org:eksempeluniversitetet.no",
	ifi: "fc:org:eksempeluniversitetet.no:unit:IFI",
	mat: "fc:org:eksempeluniversitetet.no:unit:MAT",

	// Program / cohort / class
	binfo: "fc:fs:fs:prg:eksempeluniversitetet.no:BINFO",
	binfo2024H: "fc:fs:fs:kull:eksempeluniversitetet.no:BINFO:2024H",
	binfoKlasseA: "fc:fs:fs:klasse:eksempeluniversitetet.no:BINFO:2024H:A",

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
	{ id: G.elkNorsk2A, type: "fc:gogroup", displayName: "Norsk 2A", parentId: G.elgskinnet, notBefore: NB, notAfter: NA, extra: teachingExtra("Norsk", "NOR0009") },
	{ id: G.elkEng3A, type: "fc:gogroup", displayName: "Engelsk 3A", parentId: G.elgskinnet, notBefore: NB, notAfter: NA, extra: teachingExtra("Engelsk", "ENG0009") },
	// Other
	{ id: G.elkElevraad, type: "fc:gogroup", displayName: "Elevrådet", parentId: G.elgskinnet, notBefore: NB, notAfter: NA, extra: otherExtra },

	// ── Fjelltoppen ungdomsskole ────────────────────────────────────────
	{
		id: G.fjelltoppen,
		type: "fc:org",
		displayName: "Fjelltoppen ungdomsskole",
		parentId: G.sunnvik,
		extra: j({ orgType: ["primary_and_lower_secondary"] }),
	},
	// Basis groups
	{ id: G.fjl8A, type: "fc:gogroup", displayName: "8A", parentId: G.fjelltoppen, notBefore: NB, notAfter: NA, extra: basisExtra },
	{ id: G.fjl9A, type: "fc:gogroup", displayName: "9A", parentId: G.fjelltoppen, notBefore: NB, notAfter: NA, extra: basisExtra },
	// Teaching groups
	{ id: G.fjlMatte8A, type: "fc:gogroup", displayName: "Matte 8A", parentId: G.fjelltoppen, notBefore: NB, notAfter: NA, extra: teachingExtra("Matematikk fellesfag", "MAT0009") },
	{ id: G.fjlNorsk9A, type: "fc:gogroup", displayName: "Norsk 9A", parentId: G.fjelltoppen, notBefore: NB, notAfter: NA, extra: teachingExtra("Norsk", "NOR0009") },

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
	{ id: G.binfoKlasseA, type: "fc:fs:klasse", displayName: "Klasse A", parentId: G.binfo2024H },

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
	{ id: G.adHocBeta, type: "voot:ad-hoc", displayName: "Studiegruppe Beta", public: false, extra: j({ description: "Uformell studiegruppe" }) },
];


// ── Memberships ─────────────────────────────────────────────────────────

const studentElkOrgExtra = j({ displayName: "Elev", affiliation: ["member", "student"], primaryAffiliation: "student" });
const studentSchoolExtra = j({ primarySchool: true });
const studentBasisExtra = j({ affiliation: "student", displayName: { nb: "Elev" } });

const teacherElkOrgExtra = j({ displayName: "Lærer", affiliation: ["member", "employee", "faculty"], primaryAffiliation: "faculty" });
const teacherBasisExtra = j({ affiliation: "faculty", displayName: { nb: "Lærer" } });

const studentUniOrgExtra = j({ displayName: "Student", affiliation: ["member", "student"], primaryAffiliation: "student" });
const studentUniUnitExtra = j({ primaryOrgUnit: true });
const studentProgramExtra = j({ active: true, displayName: "Student", fsroles: ["STUDENT"] });
const studentCourseExtra = j({ active: true, displayName: "Student", fsroles: ["STUDENT"], subjectRelations: "undervisning" });

const facultyUniOrgExtra = j({ displayName: "Førsteamanuensis", affiliation: ["member", "employee", "faculty"], primaryAffiliation: "faculty", title: ["Førsteamanuensis"] });
const facultyCourseExtra = j({ active: true, displayName: "Foreleser", fsroles: ["LÆRER"] });

const adminOrgExtra = j({ displayName: "Administrator", affiliation: ["member", "employee"], primaryAffiliation: "employee" });

type Membership = typeof groupMemberships.$inferInsert;

function buildMemberships(): Membership[] {
return [
	// ── Elgskinnet students (Alf, Britt, Carl, Dina) ────────────────────
	// School owner org
	{ groupId: G.sunnvik, userId: USER.alf, basic: "member", extra: studentElkOrgExtra },
	{ groupId: G.sunnvik, userId: USER.britt, basic: "member", extra: studentElkOrgExtra },
	{ groupId: G.sunnvik, userId: USER.carl, basic: "member", extra: studentElkOrgExtra },
	{ groupId: G.sunnvik, userId: USER.dina, basic: "member", extra: studentElkOrgExtra },
	// School
	{ groupId: G.elgskinnet, userId: USER.alf, basic: "member", extra: studentSchoolExtra },
	{ groupId: G.elgskinnet, userId: USER.britt, basic: "member", extra: studentSchoolExtra },
	{ groupId: G.elgskinnet, userId: USER.carl, basic: "member", extra: studentSchoolExtra },
	{ groupId: G.elgskinnet, userId: USER.dina, basic: "member", extra: studentSchoolExtra },
	// Basis groups: Alf & Britt in 1A, Carl in 2A, Dina in 3A
	{ groupId: G.elk1A, userId: USER.alf, basic: "member", extra: studentBasisExtra },
	{ groupId: G.elk1A, userId: USER.britt, basic: "member", extra: studentBasisExtra },
	{ groupId: G.elk2A, userId: USER.carl, basic: "member", extra: studentBasisExtra },
	{ groupId: G.elk3A, userId: USER.dina, basic: "member", extra: studentBasisExtra },
	// Teaching groups: Alf in Matte 1A, Britt in Norsk 2A, Carl & Dina in Eng 3A
	{ groupId: G.elkMatte1A, userId: USER.alf, basic: "member" },
	{ groupId: G.elkNorsk2A, userId: USER.britt, basic: "member" },
	{ groupId: G.elkEng3A, userId: USER.carl, basic: "member" },
	{ groupId: G.elkEng3A, userId: USER.dina, basic: "member" },
	// Alf in Elevrådet
	{ groupId: G.elkElevraad, userId: USER.alf, basic: "member" },

	// ── Fjelltoppen students (Erik, Fiona) ──────────────────────────────
	// School owner org
	{ groupId: G.sunnvik, userId: USER.erik, basic: "member", extra: studentElkOrgExtra },
	{ groupId: G.sunnvik, userId: USER.fiona, basic: "member", extra: studentElkOrgExtra },
	// School
	{ groupId: G.fjelltoppen, userId: USER.erik, basic: "member", extra: studentSchoolExtra },
	{ groupId: G.fjelltoppen, userId: USER.fiona, basic: "member", extra: studentSchoolExtra },
	// Basis groups: Erik in 8A, Fiona in 9A
	{ groupId: G.fjl8A, userId: USER.erik, basic: "member", extra: studentBasisExtra },
	{ groupId: G.fjl9A, userId: USER.fiona, basic: "member", extra: studentBasisExtra },
	// Teaching groups: Erik in Matte 8A, Fiona in Norsk 9A
	{ groupId: G.fjlMatte8A, userId: USER.erik, basic: "member" },
	{ groupId: G.fjlNorsk9A, userId: USER.fiona, basic: "member" },

	// ── University students (Gustav, Hanna, Isak, Julie) ────────────────
	// University org
	{ groupId: G.eku, userId: USER.gustav, basic: "member", extra: studentUniOrgExtra },
	{ groupId: G.eku, userId: USER.hanna, basic: "member", extra: studentUniOrgExtra },
	{ groupId: G.eku, userId: USER.isak, basic: "member", extra: studentUniOrgExtra },
	{ groupId: G.eku, userId: USER.julie, basic: "member", extra: studentUniOrgExtra },
	// Org units: Gustav & Hanna in IFI, Isak & Julie in MAT
	{ groupId: G.ifi, userId: USER.gustav, basic: "member", extra: studentUniUnitExtra },
	{ groupId: G.ifi, userId: USER.hanna, basic: "member", extra: studentUniUnitExtra },
	{ groupId: G.mat, userId: USER.isak, basic: "member", extra: studentUniUnitExtra },
	{ groupId: G.mat, userId: USER.julie, basic: "member", extra: studentUniUnitExtra },
	// BINFO program
	{ groupId: G.binfo, userId: USER.gustav, basic: "member", extra: studentProgramExtra },
	{ groupId: G.binfo, userId: USER.hanna, basic: "member", extra: studentProgramExtra },
	{ groupId: G.binfo, userId: USER.isak, basic: "member", extra: studentProgramExtra },
	{ groupId: G.binfo, userId: USER.julie, basic: "member", extra: studentProgramExtra },
	// 2024H cohort
	{ groupId: G.binfo2024H, userId: USER.gustav, basic: "member" },
	{ groupId: G.binfo2024H, userId: USER.hanna, basic: "member" },
	{ groupId: G.binfo2024H, userId: USER.isak, basic: "member" },
	{ groupId: G.binfo2024H, userId: USER.julie, basic: "member" },
	// Klasse A: Gustav & Hanna
	{ groupId: G.binfoKlasseA, userId: USER.gustav, basic: "member" },
	{ groupId: G.binfoKlasseA, userId: USER.hanna, basic: "member" },
	// Courses: Gustav & Isak in IN1000, Hanna & Julie in MAT1100
	{ groupId: G.in1000, userId: USER.gustav, basic: "member", extra: studentCourseExtra },
	{ groupId: G.in1000, userId: USER.isak, basic: "member", extra: studentCourseExtra },
	{ groupId: G.mat1100, userId: USER.hanna, basic: "member", extra: studentCourseExtra },
	{ groupId: G.mat1100, userId: USER.julie, basic: "member", extra: studentCourseExtra },

	// ── Teacher Kari → Elgskinnets ─────────────────────────────────────
	{ groupId: G.sunnvik, userId: USER.kari, basic: "admin", extra: teacherElkOrgExtra },
	{ groupId: G.elgskinnet, userId: USER.kari, basic: "member", extra: studentSchoolExtra },
	// Admin of all Elgskinnet education groups
	{ groupId: G.elk1A, userId: USER.kari, basic: "admin", extra: teacherBasisExtra },
	{ groupId: G.elk2A, userId: USER.kari, basic: "admin", extra: teacherBasisExtra },
	{ groupId: G.elk3A, userId: USER.kari, basic: "admin", extra: teacherBasisExtra },
	{ groupId: G.elkMatte1A, userId: USER.kari, basic: "admin", extra: teacherBasisExtra },
	{ groupId: G.elkNorsk2A, userId: USER.kari, basic: "admin", extra: teacherBasisExtra },
	{ groupId: G.elkEng3A, userId: USER.kari, basic: "admin", extra: teacherBasisExtra },
	{ groupId: G.elkElevraad, userId: USER.kari, basic: "admin", extra: teacherBasisExtra },

	// ── Teacher Lars → Fjelltoppen ─────────────────────────────────────
	{ groupId: G.sunnvik, userId: USER.lars, basic: "admin", extra: teacherElkOrgExtra },
	{ groupId: G.fjelltoppen, userId: USER.lars, basic: "member", extra: studentSchoolExtra },
	// Admin of all Fjelltoppen education groups
	{ groupId: G.fjl8A, userId: USER.lars, basic: "admin", extra: teacherBasisExtra },
	{ groupId: G.fjl9A, userId: USER.lars, basic: "admin", extra: teacherBasisExtra },
	{ groupId: G.fjlMatte8A, userId: USER.lars, basic: "admin", extra: teacherBasisExtra },
	{ groupId: G.fjlNorsk9A, userId: USER.lars, basic: "admin", extra: teacherBasisExtra },

	// ── Faculty Marte → University ─────────────────────────────────────
	{ groupId: G.eku, userId: USER.marte, basic: "admin", extra: facultyUniOrgExtra },
	{ groupId: G.ifi, userId: USER.marte, basic: "member", extra: studentUniUnitExtra },
	// Owner of courses
	{ groupId: G.in1000, userId: USER.marte, basic: "owner", extra: facultyCourseExtra },
	{ groupId: G.mat1100, userId: USER.marte, basic: "owner", extra: facultyCourseExtra },

	// ── Admin Nils → School owner ──────────────────────────────────────
	{ groupId: G.sunnvik, userId: USER.nils, basic: "admin", extra: adminOrgExtra },

	// ── Ad hoc groups ──────────────────────────────────────────────────
	{ groupId: G.adHocAlpha, userId: USER.gustav, basic: "owner" },
	{ groupId: G.adHocAlpha, userId: USER.hanna, basic: "member" },
	{ groupId: G.adHocAlpha, userId: USER.isak, basic: "member" },
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
