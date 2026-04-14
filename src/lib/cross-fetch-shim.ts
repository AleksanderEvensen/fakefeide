/**
 * Shim for `cross-fetch` that delegates to the platform's built-in globals.
 *
 * `@libsql/hrana-client` imports `fetch`, `Request`, and `Headers` from
 * `cross-fetch`, which pulls in a Node.js `http`-based polyfill. That polyfill
 * breaks inside Cloudflare Workers (and Miniflare) because the Workers runtime
 * already provides spec-compliant web APIs and the Node.js HTTP internals are
 * not fully compatible.
 *
 * By aliasing `cross-fetch` to this module (via Vite resolve.alias), the
 * hrana-client transparently uses the native implementations instead.
 */

export const fetch = globalThis.fetch;
export const Request = globalThis.Request;
export const Headers = globalThis.Headers;
export const Response = globalThis.Response;
export default globalThis.fetch;
