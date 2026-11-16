import { z } from 'zod'

const sourceMapSchema = z.object({ sourcesContent: z.array(z.string().nullable()).min(1) })

// Bundles from the API use `source/...`; bundles built locally use `file:///source/...`
const FUNCTION_SOURCE_PREFIXES = ['source/', 'file:///source/']

// Extracts the function's own source files from an eszip bundle. The bundle also contains every
// remote dependency (jsr/npm/https), which we leave out since the function imports them by specifier.
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
  const specifiers: string[] = await parser.parseBytes(eszip)
  await parser.load()

  const files: { name: string; content: string }[] = []
  for (const specifier of specifiers) {
    const prefix = FUNCTION_SOURCE_PREFIXES.find((p) => specifier.startsWith(p))
    if (!prefix) continue
    const content =
      (await getOriginalSource(parser, specifier)) ?? (await parser.getModuleSource(specifier))
    files.push({ name: specifier.slice(prefix.length), content: content ?? '' })
  }

  return files
}
