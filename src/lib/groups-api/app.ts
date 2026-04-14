import { Hono } from "hono";
import { cors } from "hono/cors";
import grouptypes from "./routes/grouptypes";
import me from "./routes/me";
import groupsRoutes from "./routes/groups";
import orgs from "./routes/orgs";

const app = new Hono().basePath("/api/groups");

app.use(cors({ origin: "*", allowMethods: ["GET"] }));

app.route("/grouptypes", grouptypes);
app.route("/me", me);
app.route("/v1/orgs", orgs);
app.route("/groups", groupsRoutes);

export default app;
