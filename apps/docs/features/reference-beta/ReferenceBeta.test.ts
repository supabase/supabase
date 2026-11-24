import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { REFERENCE_BETA_DIRECTORY } from '~/lib/docs'
import { describe, expect, it } from 'vitest'

import { renderSchemas } from '../../scripts/federated-reference/generate-schema'
import { definitionFrontmatterSchema, libraryIndexFrontmatterSchema } from './ReferenceBeta.schema'
import {
  buildNavigationMenu,
  definitionLabels,
  getDefinitions,
  getLibrary,
  getLibrarySlugs,
  getReferenceBetaStaticParams,
  groupByCategory,
  parameterLabels,
  type Library,
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

describe('buildNavigationMenu', () => {
  const definition = (id: string, category: string, subcategory?: string) =>
    ({ meta: { id, category, subcategory, title: id } }) as Parameters<
      typeof groupByCategory
    >[0][number]
  const library = { slug: ['js'], meta: { title: 'JS' }, content: '' } as Library

  it('nests definitions with a subcategory inside their category', () => {
    const menu = buildNavigationMenu(library, [
      definition('select', 'Database'),
      definition('eq', 'Database', 'Filters'),
      definition('neq', 'Database', 'Filters'),
      definition('order', 'Database', 'Modifiers'),
      definition('eq-auth', 'Auth', 'Filters'),
    ])

    expect(menu.items).toEqual([
      { name: 'Introduction', url: '/reference-beta/js' },
      {
        name: 'Auth',
        items: [
          { name: 'Filters', items: [{ name: 'eq-auth', url: '/reference-beta/js/eq-auth' }] },
        ],
      },
      {
        name: 'Database',
        items: [
          { name: 'select', url: '/reference-beta/js/select' },
          {
            name: 'Filters',
            items: [
              { name: 'eq', url: '/reference-beta/js/eq' },
              { name: 'neq', url: '/reference-beta/js/neq' },
            ],
          },
          { name: 'Modifiers', items: [{ name: 'order', url: '/reference-beta/js/order' }] },
        ],
      },
    ])
  })
})

describe('hidden labels', () => {
  const none = new Set<string>()

  it('shows required or optional, and deprecated', () => {
    expect(parameterLabels({ name: 'a', required: true }, none)).toEqual(['required'])
    expect(parameterLabels({ name: 'a', required: false, deprecated: true }, none)).toEqual([
      'optional',
      'deprecated',
    ])
    expect(definitionLabels({ stability: 'beta', deprecated: true }, none)).toEqual([
      'beta',
      'deprecated',
    ])
    expect(definitionLabels({ stability: 'stable', deprecated: false }, none)).toEqual([])
  })

  it('leaves out the labels a library hides', () => {
    const hidden = new Set(['optional', 'deprecated'])
    expect(parameterLabels({ name: 'a', required: false }, hidden)).toEqual([])
    expect(parameterLabels({ name: 'a', required: true, deprecated: true }, hidden)).toEqual([
      'required',
    ])
    expect(definitionLabels({ stability: 'experimental', deprecated: true }, hidden)).toEqual([
      'experimental',
    ])
  })

  it('only accepts known labels in an index', () => {
    const index = { title: 'CLI' }
    expect(
      libraryIndexFrontmatterSchema.safeParse({ ...index, hidden_labels: ['optional'] }).success
    ).toBe(true)
    expect(
      libraryIndexFrontmatterSchema.safeParse({ ...index, hidden_labels: ['optionnal'] }).success
    ).toBe(false)
  })
})

describe('schema', () => {
  it('rejects unknown keys and kinds', () => {
    const base = { id: 'a', kind: 'method', title: 'a()', summary: 'A.' }
    expect(definitionFrontmatterSchema.safeParse(base).success).toBe(true)
    expect(definitionFrontmatterSchema.safeParse({ ...base, kind: 'function' }).success).toBe(false)
    expect(definitionFrontmatterSchema.safeParse({ ...base, section: 'auth' }).success).toBe(false)
    expect(
      definitionFrontmatterSchema.safeParse({
        ...base,
        category: 'Database',
        subcategory: 'Filters',
      }).success
    ).toBe(true)
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
