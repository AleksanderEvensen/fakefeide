import { Hono } from "hono";

const GROUP_TYPES = [
	{ id: "fc:org", displayName: "Organization" },
	{ id: "fc:orgunit", displayName: "Organization Unit" },
	{ id: "fc:gogroup", displayName: "Education Group" },
	{ id: "fc:grep", displayName: "Grep" },
	{ id: "fc:grep2", displayName: "Grep2" },
	{ id: "fc:fs:prg", displayName: "Program of Study" },
	{ id: "fc:fs:klasse", displayName: "Class" },
	{ id: "fc:fs:emne", displayName: "Course" },
	{ id: "fc:fs:str", displayName: "Field of Study" },
	{ id: "voot:ad-hoc", displayName: "Ad-hoc Group" },
];

const app = new Hono();

app.get("/", (c) => c.json(GROUP_TYPES));

export default app;
