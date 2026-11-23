import { describe, expect, it } from 'vitest'

import { extractFunctionSourcesFromEszip, getFunctionFileSpecifiers } from './EdgeFunctions.eszip'

type BundleEntry =
  | { kind: 'module'; specifier: string; source: string | Uint8Array; sourceMap?: string }
  | { kind: 'redirect'; specifier: string; target: string }
  | { kind: 'npm'; specifier: string }

const encoder = new TextEncoder()

const u32 = (value: number) =>
  new Uint8Array([value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255])

const concat = (parts: Uint8Array[]) => {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0))
  let offset = 0
  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }
  return result
}

const section = (data: Uint8Array) => concat([u32(data.length), data])

// Mirrors the layout of the bundles returned by the Management API (verified against real ones):
// magic, options, modules header, npm snapshot, sources, source maps.
const buildBundle = (entries: BundleEntry[], magic = 'ESZIP2.3') => {
  const header: Uint8Array[] = []
  const sources: Uint8Array[] = []
  const sourceMaps: Uint8Array[] = []
  let sourcesSize = 0
  let sourceMapsSize = 0

  for (const entry of entries) {
    const specifier = encoder.encode(entry.specifier)
    header.push(u32(specifier.length), specifier)

    if (entry.kind === 'module') {
      const source = typeof entry.source === 'string' ? encoder.encode(entry.source) : entry.source
      const sourceMap = entry.sourceMap ? encoder.encode(entry.sourceMap) : new Uint8Array()
      header.push(
        new Uint8Array([0]),
        u32(sourcesSize),
        u32(source.length),
        u32(sourceMapsSize),
        u32(sourceMap.length),
        new Uint8Array([0])
      )
      sources.push(source)
      sourceMaps.push(sourceMap)
      sourcesSize += source.length
      sourceMapsSize += sourceMap.length
    } else if (entry.kind === 'redirect') {
      const target = encoder.encode(entry.target)
      header.push(new Uint8Array([1]), u32(target.length), target)
    } else {
      header.push(new Uint8Array([2]), u32(0))
    }
  }

  return concat([
    encoder.encode(magic),
    section(new Uint8Array([0, 0, 1, 0])),
    section(concat(header)),
    section(encoder.encode('npm snapshot')),
    section(concat(sources)),
    section(concat(sourceMaps)),
  ])
}

const sourceMapOf = (original: string) => JSON.stringify({ version: 3, sourcesContent: [original] })

describe('extractFunctionSourcesFromEszip', () => {
  it('returns only the function files, leaving out dependencies and internal entries', () => {
    const bundle = buildBundle([
      { kind: 'module', specifier: 'large-bundle/index.ts', source: 'index' },
      { kind: 'module', specifier: 'large-bundle/utils/greet.ts', source: 'greet' },
      {
        kind: 'module',
        specifier: 'https://jsr.io/@supabase/server/1.9.2/src/index.ts',
        source: 'dep',
      },
      { kind: 'module', specifier: 'vfs://0', source: 'vfs' },
      { kind: 'module', specifier: '---EDGE-RUNTIME-METADATA---', source: 'metadata' },
      { kind: 'redirect', specifier: 'jsr:@supabase/server@^1', target: 'https://jsr.io/x.ts' },
      { kind: 'npm', specifier: 'npm:lodash@4' },
    ])

    const files = extractFunctionSourcesFromEszip(bundle)

    expect(files).toEqual([
      { name: 'index.ts', content: 'index' },
      { name: 'utils/greet.ts', content: 'greet' },
    ])
  })

  it('prefers the original text from the source map and falls back to the stored source', () => {
    const bundle = buildBundle([
      {
        kind: 'module',
        specifier: 'source/index.ts',
        source: 'export const greet = (name)=>name;',
        sourceMap: sourceMapOf('export const greet = (name: string) => name'),
      },
      { kind: 'module', specifier: 'source/legacy.js', source: 'legacy' },
    ])

    const files = extractFunctionSourcesFromEszip(bundle)

    expect(files).toEqual([
      { name: 'index.ts', content: 'export const greet = (name: string) => name' },
      { name: 'legacy.js', content: 'legacy' },
    ])
  })

  it('keeps static files as exact bytes, even when they are not valid UTF-8', () => {
    const video = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0xff, 0xfe, 0x00, 0x80, 0xc0])
    const bundle = buildBundle([
      { kind: 'module', specifier: 'large-bundle/index.ts', source: 'index' },
      { kind: 'module', specifier: 'static:large-bundle/assets/clip.webm', source: video },
    ])

    const files = extractFunctionSourcesFromEszip(bundle)

    expect(files.map((f) => f.name)).toEqual(['index.ts', 'assets/clip.webm'])
    expect(files[1].content).toEqual(video)
  })

  it.each([
    {
      reason: 'the bundle format is not supported',
      bundle: buildBundle([], 'ESZIP2.1'),
      message: 'Unsupported bundle format',
    },
    {
      reason: 'the bundle is truncated',
      bundle: buildBundle([{ kind: 'module', specifier: 'source/index.ts', source: 'x' }]).slice(
        0,
        40
      ),
      message: 'truncated or corrupted',
    },
    {
      reason: 'the bundle has no function files',
      bundle: buildBundle([
        { kind: 'module', specifier: 'https://example.com/dep.ts', source: 'x' },
      ]),
      message: 'No function files found',
    },
  ])('throws instead of returning nothing when $reason', ({ bundle, message }) => {
    expect(() => extractFunctionSourcesFromEszip(bundle)).toThrow(message)
  })
})

describe('getFunctionFileSpecifiers', () => {
  const names = (specifiers: string[]) => getFunctionFileSpecifiers(specifiers).map((f) => f.name)

  it('strips the shared root folder whether it is `source` or the function slug', () => {
    expect(names(['source/index.ts', 'source/utils/greet.ts'])).toEqual([
      'index.ts',
      'utils/greet.ts',
    ])
    expect(names(['large-bundle/index.ts', 'large-bundle/utils/greet.ts'])).toEqual([
      'index.ts',
      'utils/greet.ts',
    ])
  })

  it('only strips one level, so a nested folder with the same name survives', () => {
    expect(names(['auth/index.ts', 'auth/auth/handler.ts'])).toEqual([
      'index.ts',
      'auth/handler.ts',
    ])
  })

  it('decodes percent-encoded `file:///` paths without touching separators', () => {
    const specifiers = [
      'file:///source/index.ts',
      'file:///source/my%20file.ts',
      'file:///source/caf%C3%A9/100%25.ts',
      'file:///source/bad%ZZname.ts',
    ]
    expect(names(specifiers)).toEqual(['index.ts', 'my file.ts', 'café/100%.ts', 'bad%ZZname.ts'])
  })

  it('keeps names as-is when files do not share a root folder', () => {
    expect(names(['index.ts', 'utils/greet.ts'])).toEqual(['index.ts', 'utils/greet.ts'])
  })
})
