import { build } from '@deno/eszip'
import { describe, expect, it } from 'vitest'

import { extractFunctionSourcesFromEszip, getFunctionFileSpecifiers } from './EdgeFunctions.eszip'

const sources: Record<string, string> = {
  'file:///source/index.ts': 'import { greet } from "./utils/greet.ts"\nconsole.log(greet("hi"))\n',
  'file:///source/utils/greet.ts': 'export const greet = (name: string) => `hello ${name}`\n',
  'https://example.com/dep.ts': 'export const dep = 1\n',
}

const buildEszip = (entrypoint: string, modules: Record<string, string>) =>
  build([entrypoint], async (specifier) => {
    const content = modules[specifier]
    if (content === undefined) return undefined
    return { kind: 'module', specifier, content }
  })

describe('extractFunctionSourcesFromEszip', () => {
  it('returns only the function source files, relative to the function root', async () => {
    const eszip = await buildEszip('file:///source/index.ts', {
      ...sources,
      'file:///source/index.ts': `import "https://example.com/dep.ts"\n${sources['file:///source/index.ts']}`,
    })

    const files = await extractFunctionSourcesFromEszip(eszip)

    expect(files.map((f) => f.name).sort()).toEqual(['index.ts', 'utils/greet.ts'])
    expect(files.find((f) => f.name === 'utils/greet.ts')?.content).toBe(
      sources['file:///source/utils/greet.ts']
    )
  })

  it('throws instead of returning an empty list when the bundle has no function files', async () => {
    const eszip = await buildEszip('https://example.com/dep.ts', sources)

    await expect(extractFunctionSourcesFromEszip(eszip)).rejects.toThrow('No function files found')
  })
})

describe('getFunctionFileSpecifiers', () => {
  const names = (specifiers: string[]) => getFunctionFileSpecifiers(specifiers).map((f) => f.name)

  it('keeps the function files and drops dependencies and internal bundle entries', () => {
    const specifiers = [
      'large-bundle/index.ts',
      'large-bundle/padding.ts',
      '---SUPABASE-ESZIP-VERSION-ESZIP---',
      'vfs://0',
      'vfs://1',
      'https://jsr.io/@supabase/server/1.9.2/src/index.ts',
      'jsr:@supabase/server@^1',
      'npm:lodash@4',
      '---EDGE-RUNTIME-METADATA---',
    ]
    expect(names(specifiers)).toEqual(['index.ts', 'padding.ts'])
  })

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

  it('keeps `../` in names of shared files outside the function root, for the ZIP to resolve', () => {
    expect(
      names(['file:///source/index.ts', 'file:///source/../_shared/cors.ts', 'source/../../x.ts'])
    ).toEqual(['index.ts', '../_shared/cors.ts', '../../x.ts'])
  })

  it('keeps names as-is when files do not share a root folder', () => {
    expect(names(['index.ts', 'utils/greet.ts'])).toEqual(['index.ts', 'utils/greet.ts'])
  })
})
