import { createFileRoute } from "@tanstack/react-router";
import app from "#/lib/groups-api/app";

export const Route = createFileRoute("/api/groups/$")({
	server: {
		handlers: {
			GET: ({ request }) => app.fetch(request),
		},
	},
});
