/**
 * Pure helpers for the one-page-per-command CLI reference. No file system
 * access, so the proxy can import them too.
 */
import { REFERENCES } from '~/content/navigation.references'
import cliV2Sections from '~/spec/common-cli-sections.json' with { type: 'json' }
import cliV3Sections from '~/spec/common-cli-v3-sections.json' with { type: 'json' }

export const CLI_VERSIONS: ReadonlyArray<string> = REFERENCES.cli.versions
export const LATEST_CLI_VERSION = CLI_VERSIONS[0]

export const CLI_GLOBAL_FLAGS_SLUG = 'global-flags'
export const CLI_MIGRATION_GUIDE_SLUG = 'migrating-from-v2'

export function isCliVersion(version: string) {
  return CLI_VERSIONS.includes(version)
}

/** `/reference/cli` for the latest version, `/reference/cli/<version>` otherwise. */
export function cliBasePath(version: string) {
  return version === LATEST_CLI_VERSION ? '/reference/cli' : `/reference/cli/${version}`
}

/** Joins a page path relative to the version root (`db/push`, `''` for the overview). */
export function cliPageHref(version: string, rel: string) {
  return rel ? `${cliBasePath(version)}/${rel}` : cliBasePath(version)
}

/** The migration guide only exists for the latest major. */
export function cliMigrationGuideHref(anchor?: string) {
  return `${cliPageHref(LATEST_CLI_VERSION, CLI_MIGRATION_GUIDE_SLUG)}${anchor ? `#${anchor}` : ''}`
}

/** `supabase db push` -> `db push` */
export function cliCommandName(title: string) {
  return title.replace(/^supabase ?/, '') || 'supabase'
}

/** `supabase inspect db bloat` -> `inspect/db/bloat` */
export function cliCommandRel(title: string) {
  return cliCommandName(title).split(' ').join('/')
}

export function sentence(text = '') {
  const trimmed = text.trim()
  if (!trimmed) return ''
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`
}

/**
 * psql-style output (`│` / `|` columns over a `─┼─` rule) inside a fence reads
 * as a broken table; turn every such fence into a GFM table.
 */
export function psqlTables(markdown: string) {
  return markdown.replace(/```[a-z]*\n([\s\S]*?)```/g, (block, body: string) => {
    const table = psqlTable(body)
    return table ? `${table}\n` : block
  })
}

/** A GFM table for psql-style output, or undefined when it isn't one. */
export function psqlTable(output: string) {
  const lines = output.split('\n').filter((line) => line.trim())
  const rule = lines.findIndex((line) => /^[\s─-]+[┼+][─\-┼+\s]*$/.test(line))
  if (rule !== 1) return undefined
  const cells = (line: string) =>
    line.split(/[│|]/).map((cell) => cell.trim().replace(/\|/g, '\\|'))
  const head = cells(lines[0])
  const rows = lines.slice(2).map(cells)
  return [
    `| ${head.join(' | ')} |`,
    `| ${head.map(() => '--').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n')
}

/**
 * Most descriptions open with a paragraph that says the summary again in more
 * words. Skip it when it is barely longer than the summary and shares nearly
 * all of its meaningful words.
 */
export function restatesSummary(summary: string, paragraph: string) {
  const words = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z ]/g, '')
      .split(' ')
      .filter((word) => word.length > 3)
  const summaryWords = new Set(words(summary))
  const paragraphWords = words(paragraph)
  const overlap = paragraphWords.filter((word) => summaryWords.has(word)).length
  return paragraphWords.length <= summaryWords.size + 4 && overlap >= summaryWords.size - 1
}

/**
 * Within a sidebar group every command shares a prefix (`db …`,
 * `inspect db …`); keep only what differs so long names fit on one line.
 */
export function shortLabel(name: string, groupNames: string[]) {
  const words = groupNames.map((groupName) => groupName.split(' '))
  let shared = 0
  while (words.every((w) => w[shared] !== undefined && w[shared] === words[0][shared])) shared++
  const own = name.split(' ')
  return own.length > shared ? own.slice(shared).join(' ') : name
}

const HIDDEN_DEFAULTS = new Set(['', 'false', '[]', '""'])

export interface DescribedFlag {
  id: string
  /** `--lang <lang>` for enum flags, the spec name otherwise */
  label: string
  /** Long form (`--lang`), used to match breaking changes */
  long?: string
  description: string
  choices?: string[]
  defaultValue?: string
  required: boolean
}

export function describeFlag(flag: {
  id: string
  name: string
  description?: string
  default_value?: string
  required?: boolean
  accepted_values?: Array<{ name: string }>
}): DescribedFlag {
  const choices =
    flag.accepted_values?.map(({ name }) => name) ??
    flag.name.match(/<\[\s*(.+?)\s*\]>/)?.[1].split(/\s*\|\s*/)
  const defaultValue =
    flag.default_value && !HIDDEN_DEFAULTS.has(flag.default_value) ? flag.default_value : undefined
  return {
    id: flag.id,
    label: choices ? flag.name.replace(/<\[.+?\]>/, `<${flag.id}>`) : flag.name,
    long: flag.name.match(/--[\w-]+/)?.[0],
    description: sentence((flag.description ?? '').replace(/\s*\(default [^)]*\)/i, '')),
    choices,
    defaultValue,
    required: !!flag.required,
  }
}

type SectionNode = { id?: string; title?: string; type?: string; items?: SectionNode[] }

function commandTitlesById(sections: SectionNode[]) {
  const titles = new Map<string, string>()
  const walk = (nodes: SectionNode[]) =>
    nodes.forEach((node) => {
      if (node.type === 'cli-command' && node.id && node.title) titles.set(node.id, node.title)
      if (node.items) walk(node.items)
    })
  walk(sections)
  return titles
}

const LEGACY_TITLES: Record<string, Map<string, string>> = {
  v3: commandTitlesById(cliV3Sections as SectionNode[]),
  v2: commandTitlesById(cliV2Sections as SectionNode[]),
}

/** Section slugs of the old single-page reference that aren't commands. */
const LEGACY_OVERVIEW_SLUGS = new Set(['introduction', 'usage'])

/**
 * Where an old CLI reference URL lives now, relative to `/docs`, or undefined
 * when the path is already current. `segments` follow `/reference/cli`.
 *
 * - `/reference/cli/v3/...` (v3 was the prerelease) -> the unversioned latest path
 * - `/reference/cli/[v2/]supabase-db-push` -> `/reference/cli/[v2/]db/push`
 *
 * Unversioned legacy slugs used to show v2, but they now point at the latest
 * version, so old links land on current docs.
 */
export function cliLegacyRedirect(segments: string[]): string | undefined {
  const [first, ...rest] = segments
  const hasVersion = /^v\d+$/.test(first ?? '')
  const version = hasVersion ? first : LATEST_CLI_VERSION
  const path = hasVersion ? rest : segments
  const isLatestPrefix = hasVersion && version === LATEST_CLI_VERSION

  if (!isCliVersion(version)) return undefined

  const legacySlug = path.length === 1 ? path[0] : undefined
  if (legacySlug && LEGACY_OVERVIEW_SLUGS.has(legacySlug)) return cliPageHref(version, '')
  if (legacySlug?.startsWith('supabase-')) {
    const inVersion = LEGACY_TITLES[version]?.get(legacySlug)
    if (inVersion) return cliPageHref(version, cliCommandRel(inVersion))
    const fallback = CLI_VERSIONS.find((other) => LEGACY_TITLES[other]?.has(legacySlug))
    return fallback
      ? cliPageHref(fallback, cliCommandRel(LEGACY_TITLES[fallback].get(legacySlug)!))
      : cliPageHref(version, '')
  }

  return isLatestPrefix ? cliPageHref(version, path.join('/')) : undefined
}
