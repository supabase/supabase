// Browser stand-in for `undici`, which `@deno/eszip` imports for fetch and friends. The browser
// already provides all of these natively.
export const fetch = globalThis.fetch.bind(globalThis)
export const File = globalThis.File
export const FormData = globalThis.FormData
export const Headers = globalThis.Headers
export const Request = globalThis.Request
export const Response = globalThis.Response
