/**
 * TEMPORARY: indexes the reference pages (SDKs, CLI, Management API) for search v2 until they are
 * exported as markdown. Reads the same sources as search v1 (../search/sources/reference-doc.ts):
 * one row per reference page, and one per method, command or endpoint, named after it and indexed
 * as a page title so an exact name ranks first. Slugs are the page URLs
 * (`/docs/reference/csharp/auth-signup`).
 *
 * To remove: delete this file, its test, its call in ./ingest.ts and the `codegen:references` step
 * of `preingest:search_v2`, then run `delete from docs_search_v2 where slug like 'reference/%'` once.
 */
import { readFile } from 'node:fs/promises'
import type { SupabaseClient } from '@supabase/supabase-js'

import { getFlattenedSections } from '../../features/docs/Reference.generated.singleton.js'
import type { BaseSource } from '../search/sources/base.js'
import {
  ClientLibReferenceLoader,
  CliReferenceLoader,
  CliReferenceSource,
  loadClientLibReferenceFromNewPipeline,
  OpenApiReferenceLoader,
  OpenApiReferenceSource,
  type ClientLibReferenceSource,
} from '../search/sources/reference-doc.js'

const INSERT_BATCH_SIZE = 200

export interface ReferenceRow {
  slug: string
  file_path: string
  page_title: string
  heading: string
  heading_level: number
  heading_path: string[]
  content: string
  excerpt: string
}

export interface Reference {
  /** The SDK id, also the path of the page: `/docs/reference/<id>` */
  id: string
  version: string
  title: string
  load: () => Promise<BaseSource[]>
}

const newPipelineLib = (id: string, version: string, title: string): Reference => ({
  id,
  version,
  title,
  load: () =>
    loadClientLibReferenceFromNewPipeline({
      source: `${id}-lib`,
      path: `/reference/${id}`,
      meta: { title },
      contentDir: `content/reference/${id}/${version}`,
    }),
})

const legacyLib = (id: string, version: string, title: string, specFile: string): Reference => ({
  id,
  version,
  title,
  load: () =>
    new ClientLibReferenceLoader(
      `${id}-lib`,
      `/reference/${id}`,
      { title },
      `spec/${specFile}`,
      'spec/common-client-libs-sections.json'
    ).load(),
})

// The search v1 sources (../search/sources/index.ts can't be imported here: it also loads guides
// that need the react-server condition). Kotlin reads the v3 spec the page renders, not v1.
export const REFERENCES: Reference[] = [
  newPipelineLib('javascript', 'v2', 'JavaScript Reference'),
  newPipelineLib('server', 'v1', 'Server Reference'),
  newPipelineLib('middleware', 'v1', 'Middleware Reference'),
  newPipelineLib('dart', 'v3', 'Flutter Reference'),
  legacyLib('python', 'v2', 'Python Reference', 'supabase_py_v2.yml'),
  legacyLib('csharp', 'v8', 'C# Reference', 'supabase_csharp_v8.yml'),
  legacyLib('swift', 'v2', 'Swift Reference', 'supabase_swift_v2.yml'),
  legacyLib('kotlin', 'v3', 'Kotlin Reference', 'supabase_kt_v3.yml'),
  {
    id: 'cli',
    version: 'latest',
    title: 'CLI Reference',
    load: () =>
      new CliReferenceLoader(
        'cli',
        '/reference/cli',
        { title: 'CLI Reference' },
        'spec/cli_v1_commands.yaml',
        'spec/common-cli-sections.json'
      ).load(),
  },
  {
    id: 'api',
    version: 'latest',
    title: 'Management API Reference',
    load: () =>
      new OpenApiReferenceLoader(
        'api',
        '/reference/api',
        { title: 'Management API Reference' },
        'spec/transforms/api_v1_openapi_deparsed.json',
        'spec/common-api-sections.json'
      ).load(),
  },
]

/** 'signInWithPassword' -> 'sign In With Password', 'sign_in_with_password' -> 'sign in with password'. */
export function splitIdentifier(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_\-.]+/g, ' ')
    .trim()
}

/** 'SignIn(email, password)' -> 'SignIn', 'Fetch data: select()' -> 'select'; undefined when not a method ('Using Filters'). */
export function cleanMethodName(title: string): string | undefined {
  const name = title
    .replace(/^[^:()]+:\s+/, '')
    .replace(/\([^()]*\)/g, '')
    .split(/\s+and\s+/)[0]
    .trim()
  return /^[A-Za-z_][\w.]*$/.test(name) && !/^overview$/i.test(name) ? name : undefined
}

/** Markdown as one line of text: links keep their text, code keeps its name. */
function plainText(markdown: string) {
  return markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`|\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function firstSentence(text: string, maxLength = 200) {
  const sentence = text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text
  if (sentence.length <= maxLength) return sentence
  return `${sentence.slice(0, sentence.lastIndexOf(' ', maxLength))}…`
}

/** One line per distinct part. */
const lines = (...parts: string[]) => [...new Set(parts.filter(Boolean))].join('\n')

/** What a section is searched by: the method (or command, or endpoint) and its title in the sidebar. */
function describe(source: BaseSource): { name: string; title: string; description: string } {
  if (source instanceof CliReferenceSource) {
    // 'supabase db push', titled 'Push migration to remote database'
    const { specSection, refSection } = source
    return { name: specSection.title, title: refSection.title, description: specSection.summary }
  }
  if (source instanceof OpenApiReferenceSource) {
    const { operation = '', path = '', description = '' } = source.specSection
    const name = source.refSection.title
    return { name, title: name, description: `${operation.toUpperCase()} ${path}: ${description}` }
  }
  // Legacy specs title the section for humans ('Create a new user') and name the method in its
  // definition ('SignUp()'). The new pipeline titles the section after the method.
  const { specSection, refSection } = source as ClientLibReferenceSource
  return {
    name: cleanMethodName(specSection.title ?? '') ?? refSection.title,
    title: refSection.title,
    description: specSection.description ?? '',
  }
}

export function toSectionRow(reference: Reference, source: BaseSource): ReferenceRow {
  const { name, title, description } = describe(source)
  const slug = source.path.replace(/^\//, '')
  const text = plainText(description)
  return {
    slug,
    file_path: slug,
    page_title: name,
    // Only the heading path and the excerpt are displayed: the heading carries the title too, so
    // a search for the method name or the title ranks the row as a page title.
    heading: title === name ? name : `${name} ${title}`,
    heading_level: 1,
    heading_path: [reference.title, name],
    content: lines(name, splitIdentifier(name), title, text, reference.title, reference.id),
    excerpt: title === name ? firstSentence(text) : title,
  }
}

/** The reference page itself, described by the first paragraph of its introduction. */
async function toPageRow(reference: Reference): Promise<ReferenceRow> {
  const intro = await readFile(`docs/ref/${reference.id}/introduction.mdx`, 'utf8')
  const paragraph =
    intro
      .replace(/^---[\s\S]*?---/, '')
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line && !/^(<|#|-|\||```)/.test(line)) ?? ''
  const description = plainText(paragraph)
  // /docs/reference/cli redirects to a page that doesn't exist
  const slug = reference.id === 'cli' ? 'reference/cli/introduction' : `reference/${reference.id}`
  return {
    slug,
    file_path: slug,
    page_title: reference.title,
    heading: reference.title,
    heading_level: 1,
    heading_path: [reference.title],
    content: lines(reference.title, reference.id, description),
    excerpt: firstSentence(description),
  }
}

export async function buildReferenceRows(reference: Reference): Promise<ReferenceRow[]> {
  const sources = await reference.load()
  // The loaders also return the sections under a parent the SDK doesn't implement (MFA in C#),
  // which the page doesn't render.
  const rendered = new Set(
    ((await getFlattenedSections(reference.id, reference.version)) ?? []).map(
      (section: { slug?: string }) => section.slug
    )
  )

  const rows = new Map<string, ReferenceRow>()
  for (const source of sources) {
    const row = toSectionRow(reference, source)
    const sectionSlug = row.slug.split('/').pop()
    if (rendered.has(sectionSlug) && !rows.has(row.slug)) rows.set(row.slug, row)
  }
  if (rows.size === 0) {
    throw new Error(
      `No sections found for "${reference.id}". Run "pnpm run codegen:references" first.`
    )
  }
  return [await toPageRow(reference), ...rows.values()]
}

/**
 * Inserts the new rows, then deletes the ones of earlier runs, so search never misses the reference
 * pages in between and removed or renamed methods don't linger.
 */
export async function ingestReferencePages({
  supabase,
  table,
}: {
  supabase: SupabaseClient
  table: string
}) {
  const rows: ReferenceRow[] = []
  for (const reference of REFERENCES) rows.push(...(await buildReferenceRows(reference)))
  console.log(`Found ${rows.length} reference page(s)`)

  const { data: latest, error: latestError } = await supabase
    .from(table)
    .select('id')
    .order('id', { ascending: false })
    .limit(1)
  if (latestError) throw new Error(`Failed to read the latest row: ${latestError.message}`)
  const lastIdBeforeInsert = latest?.[0]?.id ?? 0

  for (let i = 0; i < rows.length; i += INSERT_BATCH_SIZE) {
    const { error } = await supabase.from(table).insert(rows.slice(i, i + INSERT_BATCH_SIZE))
    if (error) throw new Error(`Failed to insert reference pages: ${error.message}`)
  }

  const { error } = await supabase
    .from(table)
    .delete()
    .like('slug', 'reference/%')
    .lte('id', lastIdBeforeInsert)
  if (error) throw new Error(`Failed to clear old reference pages: ${error.message}`)

  console.log(`Done. Ingested ${rows.length} reference page(s).`)
}
