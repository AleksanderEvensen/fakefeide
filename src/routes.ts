import { rootRoute, index, route, physical } from "@tanstack/virtual-file-routes";

export const routes = rootRoute("__root.tsx", [
	index("index.tsx"),
	route("/about", "about.tsx"),
	route("/sign-in", "sign-in.tsx"),
	route("/consent", "consent.tsx"),
	physical("/api", "api"),
	route("/api/auth/[.]well-known", [
		route(
			"/openid-configuration",
			"_well-known/openid-configuration.ts",
		),
		route(
			"/oauth-authorization-server",
			"_well-known/oauth-authorization-server.ts",
		),
	]),
]);
