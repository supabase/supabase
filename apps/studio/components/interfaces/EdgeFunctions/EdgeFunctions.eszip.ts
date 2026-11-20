import { z } from 'zod'

// eszip is Deno's single-file module-graph bundle. This reads the subset of the v2.3 layout that
// the Management API produces, without any checksums:
//
//   magic "ESZIP2.3"
//   options    u32 length, then (kind, value) byte pairs
//   modules    u32 length, then entries: u32 specifier length, specifier, u8 entry kind
//                kind 0 module:   u32 source offset, u32 source size, u32 map offset, u32 map size, u8 module kind
//                kind 1 redirect: u32 length, target
//                kind 2 npm:      u32 package index
//   npm snapshot, sources, source maps   each u32 length followed by that many bytes
//
// Module offsets point into the sources and source maps sections. Static files are stored as
// modules whose specifier starts with `static:`, with their raw bytes as the source.
const ESZIP_MAGIC = 'ESZIP2.3'
const OPTION_CHECKSUM_SIZE = 1
const ENTRY_KIND_MODULE = 0
const ENTRY_KIND_REDIRECT = 1
const ENTRY_KIND_NPM = 2

// Backed by a plain ArrayBuffer so the bytes can go straight into a Blob
type Bytes = Uint8Array<ArrayBuffer>

const sourceMapSchema = z.object({ sourcesContent: z.array(z.string().nullable()).min(1) })

type EszipModule = { specifier: string; source: Bytes; sourceMap: Bytes | undefined }

const createByteReader = (bytes: Bytes) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let offset = 0

  const take = (length: number) => {
    if (offset + length > bytes.length) {
      throw new Error('The downloaded bundle is truncated or corrupted')
    }
    const chunk = bytes.subarray(offset, offset + length)
    offset += length
    return chunk
  }

  return {
    hasMore: () => offset < bytes.length,
    bytes: take,
    u8: () => take(1)[0],
    u32: () => {
      take(4)
      return view.getUint32(offset - 4)
    },
  }
}

const slice = (section: Bytes, offset: number, size: number) => {
  if (offset + size > section.length) {
    throw new Error('The downloaded bundle is truncated or corrupted')
  }
  return section.subarray(offset, offset + size)
}

function readEszipModules(eszip: Bytes): EszipModule[] {
  const decoder = new TextDecoder()
  const reader = createByteReader(eszip)

  const magic = decoder.decode(reader.bytes(ESZIP_MAGIC.length))
  if (magic !== ESZIP_MAGIC) throw new Error(`Unsupported bundle format: ${magic}`)

  const options = reader.bytes(reader.u32())
  for (let i = 0; i + 1 < options.length; i += 2) {
    if (options[i] === OPTION_CHECKSUM_SIZE && options[i + 1] !== 0) {
      throw new Error('Unsupported bundle format: checksummed bundles are not supported')
    }
  }

  const readSection = () => reader.bytes(reader.u32())
  const modulesHeader = createByteReader(readSection())
  readSection() // npm snapshot, not needed for the function's own files
  const sources = readSection()
  const sourceMaps = readSection()

  const modules: EszipModule[] = []
  while (modulesHeader.hasMore()) {
    const specifier = decoder.decode(modulesHeader.bytes(modulesHeader.u32()))
    const entryKind = modulesHeader.u8()

    if (entryKind === ENTRY_KIND_MODULE) {
      const sourceOffset = modulesHeader.u32()
      const sourceSize = modulesHeader.u32()
      const mapOffset = modulesHeader.u32()
      const mapSize = modulesHeader.u32()
      modulesHeader.u8() // module kind
      modules.push({
        specifier,
        source: slice(sources, sourceOffset, sourceSize),
        sourceMap: mapSize > 0 ? slice(sourceMaps, mapOffset, mapSize) : undefined,
      })
    } else if (entryKind === ENTRY_KIND_REDIRECT) {
      modulesHeader.bytes(modulesHeader.u32())
    } else if (entryKind === ENTRY_KIND_NPM) {
      modulesHeader.u32() // npm package index
    } else {
      throw new Error(`Unsupported bundle format: unknown entry kind ${entryKind}`)
    }
  }

  return modules
}

const URL_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i
const LOCAL_FILE_PREFIX = 'file:///'
const STATIC_FILE_PREFIX = 'static:'

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
// no URL scheme, e.g. `source/index.ts` or `<function-slug>/index.ts` (local builds prefix them
// with `file:///`), and the static files configured for the function (`static:<path>`).
const toLocalPath = (specifier: string): string | undefined => {
  if (specifier.startsWith(LOCAL_FILE_PREFIX)) {
    return decodeUrlPath(specifier.slice(LOCAL_FILE_PREFIX.length))
  }
  if (specifier.startsWith(STATIC_FILE_PREFIX)) return specifier.slice(STATIC_FILE_PREFIX.length)
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

// The source stored in an eszip is transpiled (TypeScript types are stripped), but the
// accompanying source map carries the original file text in `sourcesContent`.
const getOriginalSource = (sourceMap: Bytes | undefined): string | undefined => {
  if (!sourceMap) return undefined

  const parsed = sourceMapSchema.safeParse(safeJsonParse(new TextDecoder().decode(sourceMap)))
  return parsed.success ? (parsed.data.sourcesContent[0] ?? undefined) : undefined
}

type ExtractedFunctionFile = { name: string; content: string | Bytes }

export function extractFunctionSourcesFromEszip(eszip: Bytes): ExtractedFunctionFile[] {
  const modulesBySpecifier = new Map(readEszipModules(eszip).map((m) => [m.specifier, m]))

  const functionFiles = getFunctionFileSpecifiers([...modulesBySpecifier.keys()])
  if (functionFiles.length === 0) {
    throw new Error('No function files found in the downloaded bundle')
  }

  return functionFiles.flatMap<ExtractedFunctionFile>(({ specifier, name }) => {
    const bundled = modulesBySpecifier.get(specifier)
    if (!bundled) return []

    // Static files are arbitrary bytes (videos, images), so they must not be decoded as text
    if (specifier.startsWith(STATIC_FILE_PREFIX)) return [{ name, content: bundled.source }]

    const content = getOriginalSource(bundled.sourceMap) ?? new TextDecoder().decode(bundled.source)
    return [{ name, content }]
  })
}
