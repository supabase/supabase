import { build } from '@deno/eszip'
import { describe, expect, it } from 'vitest'

import { extractFunctionSourcesFromEszip } from './EdgeFunctions.eszip'

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
})
