// Browser stand-in for `undici`, which `@deno/eszip` imports for fetch and friends. The browser
// already provides all of these natively. `fetch` is looked up per call so wrappers installed
// later (e.g. Sentry's instrumentation) still apply.
export const fetch: typeof globalThis.fetch = (...args) => globalThis.fetch(...args)
export const File = globalThis.File
export const FormData = globalThis.FormData
export const Headers = globalThis.Headers
export const Request = globalThis.Request
export const Response = globalThis.Response
