import { z } from 'zod'

const sourceMapSchema = z.object({ sourcesContent: z.array(z.string().nullable()).min(1) })

const URL_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i
const LOCAL_FILE_PREFIX = 'file:///'

// `file:///` specifiers are URLs, so spaces, non-ASCII characters and `%` arrive percent-encoded
// (`my%20file.ts`). Decode each segment so the entry name matches what relative imports reference.
// Decoding per segment keeps the `/` separators, and an encoded slash stays encoded rather than
// turning into a new directory.
const decodeUrlPath = (path: string): string =>
  path
    .split('/')
    .map((segment) => {
      try {
        const decoded = decodeURIComponent(segment)
        return decoded.includes('/') ? segment : decoded
      } catch {
        return segment
      }
    })
    .join('/')

// A bundle holds the function's own files next to remote dependencies (`https:`, `jsr:`, `npm:`),
// plus internal entries (`vfs://N`, `---...---` markers). The function's files are the ones with
// no URL scheme, e.g. `source/index.ts` or `<function-slug>/index.ts`; local builds prefix them
// with `file:///`.
const toLocalPath = (specifier: string): string | undefined => {
  if (specifier.startsWith(LOCAL_FILE_PREFIX)) {
    return decodeUrlPath(specifier.slice(LOCAL_FILE_PREFIX.length))
  }
  if (specifier.startsWith('---') || URL_SCHEME_PATTERN.test(specifier)) return undefined
  return specifier
}

// Every local file sits under one top-level folder (`source/`, or the function slug depending on
// how the bundle was made), which isn't part of the function's own layout.
const stripSharedRootFolder = (paths: string[]): string[] => {
  const rootFolders = new Set(paths.map((path) => (path.includes('/') ? path.split('/')[0] : '')))
  if (rootFolders.size !== 1) return paths

  const [rootFolder] = rootFolders
  return rootFolder === '' ? paths : paths.map((path) => path.slice(rootFolder.length + 1))
}

// Picks out the function's own files from a bundle's module specifiers, with their names relative
// to the function root. Remote dependencies are left out since the function imports them by specifier.
export const getFunctionFileSpecifiers = (
  specifiers: string[]
): { specifier: string; name: string }[] => {
  const local = specifiers.flatMap((specifier) => {
    const path = toLocalPath(specifier)
    return path === undefined ? [] : [{ specifier, path }]
  })
  const names = stripSharedRootFolder(local.map(({ path }) => path))

  return local.map(({ specifier }, index) => ({ specifier, name: names[index] }))
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

// The module source stored in an eszip is transpiled (TypeScript types are stripped), but the
// accompanying source map carries the original file text in `sourcesContent`.
async function getOriginalSource(
  parser: { getModuleSourceMap: (specifier: string) => Promise<unknown> },
  specifier: string
): Promise<string | undefined> {
  const sourceMap = await parser.getModuleSourceMap(specifier)
  if (typeof sourceMap !== 'string') return undefined

  const parsed = sourceMapSchema.safeParse(safeJsonParse(sourceMap))
  return parsed.success ? (parsed.data.sourcesContent[0] ?? undefined) : undefined
}

export async function extractFunctionSourcesFromEszip(
  eszip: Uint8Array
): Promise<{ name: string; content: string }[]> {
  // Lazy so the WASM parser is only loaded when someone actually downloads an oversized function
  const { Parser } = await import('@deno/eszip')

  const parser = await Parser.createInstance()
  try {
    const specifiers: string[] = await parser.parseBytes(eszip)
    await parser.load()

    const functionFiles = getFunctionFileSpecifiers(specifiers)
    if (functionFiles.length === 0) {
      throw new Error('No function files found in the downloaded bundle')
    }

    const files: { name: string; content: string }[] = []
    for (const { specifier, name } of functionFiles) {
      const content =
        (await getOriginalSource(parser, specifier)) ?? (await parser.getModuleSource(specifier))
      files.push({ name, content: content ?? '' })
    }

    return files
  } finally {
    // Releases the WASM-side memory holding the whole bundle
    parser.free()
  }
}
