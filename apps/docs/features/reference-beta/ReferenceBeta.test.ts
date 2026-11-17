import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { REFERENCE_BETA_DIRECTORY } from '~/lib/docs'
import { describe, expect, it } from 'vitest'

import { renderSchemas } from '../../scripts/federated-reference/generate-schema'
import { definitionFrontmatterSchema, libraryIndexFrontmatterSchema } from './ReferenceBeta.schema'
import {
  getDefinitions,
  getLibrary,
  getLibrarySlugs,
  getReferenceBetaStaticParams,
  groupByCategory,
} from './ReferenceBeta.utils'

describe('reference-beta content', () => {
  it('has a valid index and valid definitions for every library', async () => {
    const slugs = await getLibrarySlugs()
    expect(slugs.length).toBeGreaterThan(0)

    for (const slug of slugs) {
      // These throw, naming the file and the problem, on invalid frontmatter.
      const library = await getLibrary(slug)
      expect(library, slug.join('/')).toBeDefined()
      await getDefinitions(library!)
    }
  })

  it('generates a static path for every library and definition', async () => {
    const params = (await getReferenceBetaStaticParams()).map(({ slug }) => slug.join('/'))
    expect(params).toContain('server')

    const files = await readdir(join(REFERENCE_BETA_DIRECTORY, 'server', 'definitions'))
    for (const file of files.filter((file) => file.endsWith('.md'))) {
      expect(params).toContain(`server/${file.replace(/\.md$/, '')}`)
    }
  })
})

describe('groupByCategory', () => {
  const definition = (id: string, category: string) =>
    ({ meta: { id, category, title: id } }) as Parameters<typeof groupByCategory>[0][number]

  it('orders listed categories first, then the rest alphabetically', () => {
    const grouped = groupByCategory(
      [definition('a', 'errors'), definition('b', 'types'), definition('c', 'middleware')],
      ['middleware']
    )
    expect(grouped.map(({ category }) => category)).toEqual(['middleware', 'errors', 'types'])
  })
})

describe('schema', () => {
  it('rejects unknown keys and kinds', () => {
    const base = { id: 'a', kind: 'method', title: 'a()', summary: 'A.' }
    expect(definitionFrontmatterSchema.safeParse(base).success).toBe(true)
    expect(definitionFrontmatterSchema.safeParse({ ...base, kind: 'function' }).success).toBe(false)
    expect(definitionFrontmatterSchema.safeParse({ ...base, section: 'auth' }).success).toBe(false)
  })

  it('requires an index title', () => {
    expect(libraryIndexFrontmatterSchema.safeParse({}).success).toBe(false)
    expect(libraryIndexFrontmatterSchema.safeParse({ title: 'Server' }).success).toBe(true)
  })

  it('keeps the published JSON Schema files in sync', async () => {
    for (const [file, expected] of Object.entries(renderSchemas())) {
      const actual = await readFile(join(REFERENCE_BETA_DIRECTORY, file), 'utf-8')
      expect(actual, `${file} is stale: run \`pnpm run reference-beta:schema\``).toBe(expected)
    }
  })
})
