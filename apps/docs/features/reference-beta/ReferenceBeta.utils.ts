import { readdir, readFile } from 'node:fs/promises'
import { basename, join, relative, sep } from 'node:path'
import { REFERENCE_BETA_DIRECTORY } from '~/lib/docs'
import matter from 'gray-matter'
import { notFound } from 'next/navigation'
import { z } from 'zod/v4'

import {
  definitionFrontmatterSchema,
  libraryIndexFrontmatterSchema,
  type DefinitionFrontmatter,
  type LibraryIndexFrontmatter,
} from './ReferenceBeta.schema'

/**
 * Content layout, relative to `content/reference-beta`:
 *
 *   <library>/index.md                  introduction (Markdown body)
 *   <library>/definitions/<id>.md       one file per definition
 *   <library>/<version>/index.md        an older version, same shape
 *   <library>/<version>/definitions/
 *
 * A "library root" is any directory that holds an `index.md`. Its URL is
 * `/reference-beta/<path>`, and each definition lives at
 * `/reference-beta/<path>/<id>`.
 */

const INDEX_FILE = 'index.md'
const DEFINITIONS_DIR = 'definitions'

export interface Library {
  /** Path segments below `content/reference-beta`, e.g. `['javascript', 'v1']`. */
  slug: string[]
  meta: LibraryIndexFrontmatter
  /** Markdown body of `index.md`. */
  content: string
}

export interface Definition {
  library: Library
  meta: DefinitionFrontmatter
  /** Optional notes: the Markdown body below the frontmatter. */
  content: string
}

export const referenceBetaHref = (slug: string[], ...rest: string[]) =>
  `/reference-beta/${[...slug, ...rest].join('/')}`

function formatIssues(error: z.ZodError) {
  return z.prettifyError(error)
}

function parseWith<T extends z.ZodType>(schema: T, data: unknown, file: string): z.output<T> {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new Error(
      `Invalid reference-beta frontmatter in ${relative(REFERENCE_BETA_DIRECTORY, file)}:\n${formatIssues(result.error)}`
    )
  }
  return result.data
}

async function readIfExists(file: string): Promise<string | undefined> {
  try {
    return await readFile(file, 'utf-8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
}

/**
 * Segments come from the URL, so refuse anything that could leave the
 * reference-beta directory.
 */
function isSafeSegment(segment: string) {
  return /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(segment) && !segment.includes('..')
}

export async function getLibrary(slug: string[]): Promise<Library | undefined> {
  if (slug.length === 0 || !slug.every(isSafeSegment)) return undefined

  const file = join(REFERENCE_BETA_DIRECTORY, ...slug, INDEX_FILE)
  const raw = await readIfExists(file)
  if (raw === undefined) return undefined

  const { data, content } = matter(raw)
  return { slug, meta: parseWith(libraryIndexFrontmatterSchema, data, file), content }
}

async function readDefinition(library: Library, file: string): Promise<Definition> {
  const { data, content } = matter(await readFile(file, 'utf-8'))
  const meta = parseWith(definitionFrontmatterSchema, data, file)

  const expectedId = basename(file, '.md')
  if (meta.id !== expectedId) {
    throw new Error(
      `Definition id "${meta.id}" must match its file name in ${relative(REFERENCE_BETA_DIRECTORY, file)}`
    )
  }

  return { library, meta, content: content.trim() }
}

export async function getDefinitions(library: Library): Promise<Definition[]> {
  const dir = join(REFERENCE_BETA_DIRECTORY, ...library.slug, DEFINITIONS_DIR)

  let files: string[]
  try {
    files = (await readdir(dir)).filter((file) => file.endsWith('.md'))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }

  const definitions = await Promise.all(
    files.map((file) => readDefinition(library, join(dir, file)))
  )
  return definitions.sort((a, b) => a.meta.title.localeCompare(b.meta.title))
}

export async function getDefinition(library: Library, id: string): Promise<Definition | undefined> {
  if (!isSafeSegment(id)) return undefined

  const file = join(REFERENCE_BETA_DIRECTORY, ...library.slug, DEFINITIONS_DIR, `${id}.md`)
  if ((await readIfExists(file)) === undefined) return undefined
  return readDefinition(library, file)
}

/**
 * Finds every library root by walking the content directory. Skips each
 * root's `definitions` directory, since nothing is nested below it.
 */
export async function getLibrarySlugs(): Promise<string[][]> {
  const entries = await readdir(REFERENCE_BETA_DIRECTORY, { recursive: true, withFileTypes: true })

  return entries
    .filter((entry) => entry.isFile() && entry.name === INDEX_FILE)
    .map((entry) => relative(REFERENCE_BETA_DIRECTORY, entry.parentPath))
    .filter((dir) => dir !== '' && !dir.split(sep).includes(DEFINITIONS_DIR))
    .map((dir) => dir.split(sep))
    .sort((a, b) => a.join('/').localeCompare(b.join('/')))
}

export type ResolvedPath =
  | { type: 'index'; library: Library }
  | { type: 'definition'; definition: Definition }

/**
 * Resolves `/reference-beta/<...slug>`: either a library root (index page) or
 * a definition in the library that is the slug's parent directory.
 */
export async function resolveReferenceBetaPath(slug: string[]): Promise<ResolvedPath> {
  const library = await getLibrary(slug)
  if (library) return { type: 'index', library }

  const parent = await getLibrary(slug.slice(0, -1))
  if (parent) {
    const definition = await getDefinition(parent, slug.at(-1)!)
    if (definition) return { type: 'definition', definition }
  }

  notFound()
}

export async function getReferenceBetaStaticParams(): Promise<{ slug: string[] }[]> {
  const slugs = await getLibrarySlugs()

  const params = await Promise.all(
    slugs.map(async (slug) => {
      const library = (await getLibrary(slug))!
      const definitions = await getDefinitions(library)
      return [{ slug }, ...definitions.map(({ meta }) => ({ slug: [...slug, meta.id] }))]
    })
  )

  return params.flat()
}

/**
 * Groups definitions by `category`. Categories named in the index's
 * `category_order` come first, in that order; the rest follow alphabetically.
 */
export function groupByCategory(definitions: Definition[], order: string[] = []) {
  const categories = [...new Set(definitions.map(({ meta }) => meta.category))].sort((a, b) => {
    const ai = order.indexOf(a)
    const bi = order.indexOf(b)
    if (ai !== -1 || bi !== -1) return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi)
    return a.localeCompare(b)
  })

  return categories.map((category) => ({
    category,
    definitions: definitions.filter(({ meta }) => meta.category === category),
  }))
}

/** `auth` -> `Auth`, `user-management` -> `User management`; leaves written-out labels alone. */
export function categoryLabel(category: string) {
  if (/[A-Z\s]/.test(category)) return category
  const spaced = category.replaceAll('-', ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/**
 * The left sidebar's menu: an introduction link, then the library's
 * definitions grouped by category.
 */
export function buildNavigationMenu(library: Library, definitions: Definition[]) {
  const href = referenceBetaHref(library.slug)

  return {
    title: library.meta.title,
    url: href,
    icon: library.meta.icon,
    items: [
      { name: 'Introduction', url: href },
      ...groupByCategory(definitions, library.meta.category_order).map(
        ({ category, definitions }) => ({
          name: categoryLabel(category),
          items: definitions.map(({ meta }) => ({
            name: meta.title,
            url: referenceBetaHref(library.slug, meta.id),
          })),
        })
      ),
    ],
  }
}
