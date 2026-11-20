/**
 * Data for the CLI reference: one page per command, plus the overview, the
 * global flags page and the migration guide. Shared by the HTML pages, their
 * Markdown twins and the CLI llms.txt.
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { REFERENCES } from '~/content/navigation.references'
import {
  CLI_GLOBAL_FLAGS_SLUG,
  CLI_MIGRATION_GUIDE_SLUG,
  CLI_VERSIONS,
  cliCommandName,
  cliCommandRel,
  cliMigrationGuideHref,
  cliPageHref,
  describeFlag,
  isCliVersion,
  LATEST_CLI_VERSION,
  psqlTable,
  psqlTables,
  sentence,
} from '~/features/docs/Reference.cli.utils'
import { getCliSpec, getReferenceSections } from '~/features/docs/Reference.generated.singleton'
import type { AbbrevApiReferenceSection } from '~/features/docs/Reference.utils'
import type { CliCommand, CliSpec } from '~/generator/types/CliSpec'
import { PROD_URL } from '~/lib/constants'
import { REF_DOCS_DIRECTORY } from '~/lib/docs'
import matter from 'gray-matter'

export interface CliCategory {
  id: string
  title: string
  commands: CliCommand[]
}

export interface CliModel {
  version: string
  spec: CliSpec
  commands: CliCommand[]
  byId: Map<string, CliCommand>
  byRel: Map<string, CliCommand>
  categories: CliCategory[]
  categoryOf: Map<string, CliCategory>
}

export type CliPage =
  | { kind: 'overview' }
  | { kind: 'global-flags' }
  | { kind: 'migration-guide' }
  | { kind: 'command'; command: CliCommand }

const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-')

const models = new Map<string, Promise<CliModel>>()

export function getCliModel(version: string): Promise<CliModel> {
  if (!models.has(version)) models.set(version, buildCliModel(version))
  return models.get(version)!
}

async function buildCliModel(version: string): Promise<CliModel> {
  const [spec, sections] = await Promise.all([
    getCliSpec(version),
    getReferenceSections('cli', version) as Promise<AbbrevApiReferenceSection[]>,
  ])
  const commands = (spec.commands as CliCommand[]).filter((command) => command.id !== 'supabase')
  const byId = new Map(commands.map((command) => [command.id, command]))
  const byRel = new Map(commands.map((command) => [cliCommandRel(command.title), command]))

  const categories = sections
    .filter((section) => section.type === 'category')
    .map((section) => ({
      id: slugify(section.title ?? ''),
      title: section.title ?? '',
      commands: (section.items ?? [])
        .map((item) => byId.get(item.id))
        .filter((command): command is CliCommand => !!command)
        .sort((a, b) => cliCommandName(a.title).localeCompare(cliCommandName(b.title))),
    }))
    .filter((category) => category.commands.length > 0)
  const categoryOf = new Map(
    categories.flatMap((category) => category.commands.map((command) => [command.id, category]))
  )

  return { version, spec, commands, byId, byRel, categories, categoryOf }
}

export function cliPageRel(page: CliPage) {
  switch (page.kind) {
    case 'overview':
      return ''
    case 'global-flags':
      return CLI_GLOBAL_FLAGS_SLUG
    case 'migration-guide':
      return CLI_MIGRATION_GUIDE_SLUG
    case 'command':
      return cliCommandRel(page.command.title)
  }
}

export async function getCliPages(version: string): Promise<CliPage[]> {
  const model = await getCliModel(version)
  return [
    { kind: 'overview' },
    { kind: 'global-flags' },
    ...(version === LATEST_CLI_VERSION ? [{ kind: 'migration-guide' } as const] : []),
    ...model.commands.map((command) => ({ kind: 'command', command }) as const),
  ]
}

export async function resolveCliPage(version: string, path: string[]) {
  if (!isCliVersion(version)) return undefined
  const rel = path.join('/')
  if (rel === '') return { kind: 'overview' } as const
  if (rel === CLI_GLOBAL_FLAGS_SLUG) return { kind: 'global-flags' } as const
  if (rel === CLI_MIGRATION_GUIDE_SLUG) {
    return version === LATEST_CLI_VERSION ? ({ kind: 'migration-guide' } as const) : undefined
  }
  const command = (await getCliModel(version)).byRel.get(rel)
  return command ? ({ kind: 'command', command } as const) : undefined
}

/** Same page in every version when it exists there, else that version's overview. */
export async function getCliVersionHrefs(rel: string) {
  const entries = await Promise.all(
    CLI_VERSIONS.map(async (version) => {
      const exists = (await getCliPages(version)).some((page) => cliPageRel(page) === rel)
      return [version, cliPageHref(version, exists ? rel : '')] as const
    })
  )
  return Object.fromEntries(entries) as Record<string, string>
}

export async function getCliStaticParams() {
  const pages = await Promise.all(
    CLI_VERSIONS.map(async (version) =>
      (await getCliPages(version)).map((page) => ({
        slug: cliPageHref(version, cliPageRel(page))
          .replace(/^\/reference\//, '')
          .split('/'),
      }))
    )
  )
  return pages.flat()
}

export function cliPageTitle(page: CliPage) {
  switch (page.kind) {
    case 'overview':
      return 'Supabase CLI'
    case 'global-flags':
      return 'Global flags'
    case 'migration-guide':
      return 'Migrating from v2'
    case 'command':
      return cliCommandName(page.command.title)
  }
}

export function cliPageDescription(page: CliPage) {
  switch (page.kind) {
    case 'overview':
      return 'Develop locally, manage migrations, and deploy to Supabase.'
    case 'global-flags':
      return 'Flags accepted by every command.'
    case 'migration-guide':
      return 'Breaking changes between Supabase CLI v2 and v3, and how to update.'
    case 'command':
      return sentence(page.command.summary)
  }
}

/** Siblings first: the parent group, then commands under the same parent, then the category. */
export function cliRelatedCommands(model: CliModel, command: CliCommand, limit = 3) {
  const parentId = command.id.replace(/-[^-]+$/, '')
  const group = model.categoryOf.get(command.id)?.commands ?? []
  const score = (other: CliCommand) =>
    other.id === parentId ? 0 : other.id.startsWith(`${parentId}-`) ? 1 : 2
  return group
    .filter((other) => other.id !== command.id && !command.subcommands.includes(other.id))
    .sort((a, b) => score(a) - score(b))
    .slice(0, limit)
}

export interface CliMdxPage {
  frontmatter: Record<string, unknown>
  content: string
}

/** The hand-written (or generated upstream) MDX page for `global-flags` / `migrating-from-v2`. */
export async function getCliMdxPage(version: string, name: string): Promise<CliMdxPage> {
  const { mdxDir } = REFERENCES.cli.meta[version as keyof typeof REFERENCES.cli.meta]
  const raw = await readFile(join(REF_DOCS_DIRECTORY, mdxDir, `${name}.mdx`), 'utf-8')
  const { data, content } = matter(raw)
  return { frontmatter: data, content: content.replace(/\{\/\*[\s\S]*?\*\/\}\s*/g, '') }
}

// ---------------------------------------------------------------------------
// Markdown twins

/** Absolute URL of a page's Markdown twin. */
export function cliMarkdownUrl(version: string, rel: string) {
  return `${PROD_URL}${cliPageHref(version, rel)}.md`
}

const absoluteDocsLinks = (markdown: string) => markdown.replace(/\]\(\/docs\//g, `](${PROD_URL}/`)

function flagsTable(flags: CliSpec['flags']) {
  return [
    '| Flag | Description |',
    '| -- | -- |',
    ...flags.map((flag) => {
      const { label, description, choices, defaultValue, required } = describeFlag(flag)
      const extra = [
        choices ? `One of ${choices.map((choice) => `\`${choice}\``).join(', ')}.` : '',
        defaultValue ? `Default: \`${defaultValue}\`.` : '',
        required ? 'Required.' : '',
      ]
      // GFM splits cells on every unescaped pipe, even inside code spans
      const cell = (text: string) => text.replace(/\\/g, '\\\\').replace(/\|/g, '\\|')
      return `| \`${cell(label)}\` | ${cell([description, ...extra].filter(Boolean).join(' '))} |`
    }),
  ].join('\n')
}

function commandMarkdown(model: CliModel, command: CliCommand) {
  const { version } = model
  const lines = [`# ${command.title}`, '', `> ${sentence(command.summary)}`, '']
  for (const change of command.breaking_changes ?? []) {
    const label =
      change.direction === 'upcoming' ? `Changes in v${change.major}` : 'Changed since v2'
    lines.push(
      `**${label}:** ${change.summary} See [Migrating from v2](${PROD_URL}${cliMigrationGuideHref(change.id)}).`,
      ''
    )
  }
  if (command.description?.trim()) lines.push(psqlTables(command.description.trim()), '')
  lines.push('## Usage', '', '```sh', command.usage ?? command.title, '```', '')
  if (command.subcommands.length) {
    lines.push('## Subcommands', '')
    for (const id of command.subcommands) {
      const sub = model.byId.get(id)
      if (sub) {
        lines.push(
          `- [${cliCommandName(sub.title)}](${cliMarkdownUrl(version, cliCommandRel(sub.title))}): ${sentence(sub.summary)}`
        )
      }
    }
    lines.push('')
  }
  if (command.flags.length) {
    lines.push('## Options', '', flagsTable(command.flags), '')
    lines.push(`Plus [global flags](${cliMarkdownUrl(version, CLI_GLOBAL_FLAGS_SLUG)}).`, '')
  }
  if (command.examples?.length) {
    lines.push('## Examples', '')
    for (const example of command.examples) {
      lines.push(`### ${example.name}`, '', '```sh', example.code, '```', '')
      const response = example.response?.trimEnd()
      if (response?.trim()) {
        lines.push(psqlTable(response) ?? ['```', response, '```'].join('\n'), '')
      }
    }
  }
  return absoluteDocsLinks(lines.join('\n'))
}

function overviewMarkdown(model: CliModel) {
  const { version } = model
  const lines = [
    `# Supabase CLI ${version}`,
    '',
    `> ${cliPageDescription({ kind: 'overview' })}`,
    '',
    `- [Global flags](${cliMarkdownUrl(version, CLI_GLOBAL_FLAGS_SLUG)}): flags accepted by every command`,
    `- [Migrating from v2](${cliMarkdownUrl(LATEST_CLI_VERSION, CLI_MIGRATION_GUIDE_SLUG)}): breaking changes in v3`,
    '',
  ]
  for (const category of model.categories) {
    lines.push(`## ${category.title}`, '')
    for (const command of category.commands) {
      lines.push(
        `- [${command.title}](${cliMarkdownUrl(version, cliCommandRel(command.title))}): ${sentence(command.summary)}`
      )
    }
    lines.push('')
  }
  return lines.join('\n')
}

export async function cliPageMarkdown(version: string, page: CliPage) {
  const model = await getCliModel(version)
  switch (page.kind) {
    case 'overview':
      return overviewMarkdown(model)
    case 'global-flags':
      return [
        '# Global flags',
        '',
        `> ${cliPageDescription(page)}`,
        '',
        flagsTable(model.spec.flags),
        '',
      ].join('\n')
    case 'migration-guide': {
      const { content } = await getCliMdxPage(version, CLI_MIGRATION_GUIDE_SLUG)
      return absoluteDocsLinks(`# Migrating from v2\n\n${content.trim()}\n`)
    }
    case 'command':
      return commandMarkdown(model, page.command)
  }
}

/** llms.txt for the CLI: every command's Markdown twin, grouped by category. */
export async function cliLlmsTxt(version = LATEST_CLI_VERSION) {
  const model = await getCliModel(version)
  const lines = [
    '# Supabase CLI',
    '',
    `> Reference for Supabase CLI ${version}. Every page is also available as Markdown: add \`.md\` to its URL.`,
    '',
    '## Start here',
    '',
    `- [Overview](${cliMarkdownUrl(version, '')}): install and commands by task`,
    `- [Global flags](${cliMarkdownUrl(version, CLI_GLOBAL_FLAGS_SLUG)}): flags accepted by every command`,
    `- [Migrating from v2](${cliMarkdownUrl(LATEST_CLI_VERSION, CLI_MIGRATION_GUIDE_SLUG)}): breaking changes in v3`,
    '',
  ]
  for (const category of model.categories) {
    lines.push(`## ${category.title}`, '')
    for (const command of category.commands) {
      lines.push(
        `- [${command.title}](${cliMarkdownUrl(version, cliCommandRel(command.title))}): ${sentence(command.summary)}`
      )
    }
    lines.push('')
  }
  const older = CLI_VERSIONS.filter((other) => other !== version)
  if (older.length) {
    lines.push('## Optional', '')
    for (const other of older) {
      lines.push(`- [CLI ${other} reference](${cliMarkdownUrl(other, '')}): older major version`)
    }
    lines.push('')
  }
  return lines.join('\n')
}
