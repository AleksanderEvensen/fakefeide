import { createFileRoute } from "@tanstack/react-router";
import { auth } from "#/lib/auth";

function withAuthBasePath(request: Request): Request {
	const url = new URL(request.url);
	if (!url.pathname.startsWith("/api/auth")) {
		url.pathname = "/api/auth" + url.pathname;
		return new Request(url, request);
	}
	return request;
}

export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			GET: ({ request }) => auth.handler(withAuthBasePath(request)),
			POST: ({ request }) => auth.handler(withAuthBasePath(request)),
		},
	},
});
