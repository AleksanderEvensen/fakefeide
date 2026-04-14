import path from "node:path";
import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { cloudflare } from "@cloudflare/vite-plugin";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const config = defineConfig({
	resolve: {
		tsconfigPaths: true,
		alias: {
			// The @libsql/hrana-client imports fetch/Request/Headers from cross-fetch,
			// which uses Node.js http internals that break in Cloudflare Workers.
			// Redirect to a shim that uses the platform's built-in globals.
			"cross-fetch": path.resolve(__dirname, "src/lib/cross-fetch-shim.ts"),
		},
	},
	plugins: [
		cloudflare({ viteEnvironment: { name: "ssr" } }),
		devtools(),
		tailwindcss(),
		tanstackStart({
			router: {
				virtualRouteConfig: "./src/routes.ts",
			},
		}),
		viteReact(),
	],
});

export default config;
