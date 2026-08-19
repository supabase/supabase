import type { TarFile } from './createTarGz'

// The runtime invokes the module's default export; a top-level Deno.serve() is ignored.
const DENO_STARTER = `export default {
  fetch(_req: Request) {
    return new Response("hello from workers\\n")
  },
}
`

export const STARTER_RUNTIME = 'deno'

export const starterFiles = (): TarFile[] => [{ name: 'index.ts', content: DENO_STARTER }]
