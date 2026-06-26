import fs from 'node:fs/promises'
import path from 'node:path'
import { isFeatureEnabled, type Feature } from 'common/enabled-features'
import matter from 'gray-matter'
import yaml from 'js-yaml'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown, gfmToMarkdown } from 'mdast-util-gfm'
import { toMarkdown } from 'mdast-util-to-markdown'
import { gfm } from 'micromark-extension-gfm'

import { addBaseUrlPrefix } from './internal-links'

const GENERATED = path.join(process.cwd(), 'features/docs/generated')
const OUT_DIR = path.join(process.cwd(), 'public/markdown/reference')
const MDX_ROOT = path.join(process.cwd(), 'docs/ref')

type Section = {
  id?: string
  title?: string
  slug?: string
  type?: string
  items?: Section[]
}

type Example = { name?: string; code?: string }

type LegacyFn = {
  id: string
  $ref?: string
  title?: string
  description?: string
  notes?: string
  examples?: Example[]
}

type TypeSpec = {
  methods: Record<string, { comment?: { shortText?: string; examples?: Example[] } }>
}

type RefBase = {
  title: string
  outFile: string
  /** Folder under docs/ref/ that holds .mdx sections for `type: "markdown"` entries. */
  mdxDir: string
  /**
   * Enabled-features flag gating this reference. When set and the feature is
   * disabled in enabled-features.json, the file is not generated.
   */
  feature?: Feature
}

type SdkLegacyRef = RefBase & {
  kind: 'sdk-legacy'
  sectionsPath: string
  functionsPath: string
}

type SdkNewRef = RefBase & {
  kind: 'sdk-new'
  contentDir: string
}

type ApiRef = RefBase & {
  kind: 'api'
  sectionsPath: string
  endpointsByIdPath: string
}

type CliRef = RefBase & {
  kind: 'cli'
  sectionsPath: string
  cliSpecPath: string
}

type Ref = SdkLegacyRef | SdkNewRef | ApiRef | CliRef

const REFERENCES: Ref[] = [
  {
    kind: 'api',
    title: 'Management API Reference',
    outFile: 'api.md',
    mdxDir: path.join(MDX_ROOT, 'api'),
    sectionsPath: path.join(GENERATED, 'api.latest.sections.json'),
    endpointsByIdPath: path.join(GENERATED, 'api.latest.endpointsById.json'),
  },
  {
    kind: 'cli',
    title: 'Supabase CLI Reference',
    outFile: 'cli.md',
    mdxDir: path.join(MDX_ROOT, 'cli'),
    sectionsPath: path.join(GENERATED, 'cli.latest.sections.json'),
    cliSpecPath: path.join(process.cwd(), 'spec/cli_v1_commands.yaml'),
  },
  {
    kind: 'sdk-new',
    title: 'JavaScript Client Library Reference',
    outFile: 'js.md',
    mdxDir: path.join(MDX_ROOT, 'javascript'),
    contentDir: path.join(process.cwd(), 'content/reference/javascript/v2'),
  },
  {
    kind: 'sdk-new',
    title: 'Dart Client Library Reference',
    outFile: 'dart.md',
    mdxDir: path.join(MDX_ROOT, 'dart'),
    contentDir: path.join(process.cwd(), 'content/reference/dart/v2'),
    feature: 'sdk:dart',
  },
  {
    kind: 'sdk-legacy',
    title: 'Kotlin Client Library Reference',
    outFile: 'kotlin.md',
    mdxDir: path.join(MDX_ROOT, 'kotlin'),
    sectionsPath: path.join(GENERATED, 'kotlin.v1.sections.json'),
    functionsPath: path.join(GENERATED, 'kotlin.v1.functions.json'),
    feature: 'sdk:kotlin',
  },
  {
    kind: 'sdk-legacy',
    title: 'Python Client Library Reference',
    outFile: 'python.md',
    mdxDir: path.join(MDX_ROOT, 'python'),
    sectionsPath: path.join(GENERATED, 'python.v2.sections.json'),
    functionsPath: path.join(GENERATED, 'python.v2.functions.json'),
    feature: 'sdk:python',
  },
  {
    kind: 'sdk-legacy',
    title: 'Swift Client Library Reference',
    outFile: 'swift.md',
    mdxDir: path.join(MDX_ROOT, 'swift'),
    sectionsPath: path.join(GENERATED, 'swift.v2.sections.json'),
    functionsPath: path.join(GENERATED, 'swift.v2.functions.json'),
    feature: 'sdk:swift',
  },
  {
    kind: 'sdk-legacy',
    title: 'C# Client Library Reference',
    outFile: 'csharp.md',
    mdxDir: path.join(MDX_ROOT, 'csharp'),
    sectionsPath: path.join(GENERATED, 'csharp.v0.sections.json'),
    functionsPath: path.join(GENERATED, 'csharp.v0.functions.json'),
    feature: 'sdk:csharp',
  },
]

function flatten(sections: Section[]): Section[] {
  return sections.flatMap((s) => (s.items ? [s, ...flatten(s.items)] : [s]))
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, 'utf8')) as T
}

function renderExamples(examples: Example[] | undefined): string {
  if (!examples?.length) return ''
  const blocks = examples
    .map((ex) => {
      const header = ex.name ? `#### ${ex.name}\n\n` : ''
      const code = (ex.code ?? '').trim()
      return code ? `${header}${code}` : header.trim()
    })
    .filter(Boolean)
  return blocks.length ? `### Examples\n\n${blocks.join('\n\n')}` : ''
}

function renderFunctionSection(args: {
  title: string
  description?: string
  notes?: string
  examples?: Example[]
}): string {
  const parts = [`## ${args.title}`]
  if (args.description?.trim()) parts.push(args.description.trim())
  if (args.notes?.trim()) parts.push(args.notes.trim())
  const examples = renderExamples(args.examples)
  if (examples) parts.push(examples)
  return parts.join('\n\n')
}

/** Remove the minimum common leading whitespace from all non-empty lines. */
function dedentBlock(text: string): string {
  const lines = text.split('\n')
  const nonEmpty = lines.filter((l) => /\S/.test(l))
  if (!nonEmpty.length) return text
  const minIndent = Math.min(...nonEmpty.map((l) => (l.match(/^([ \t]*)/) ?? ['', ''])[1].length))
  if (!minIndent) return text
  return lines.map((l) => l.slice(minIndent)).join('\n')
}

/**
 * Strip MDX comments and JSX component tags while keeping inner prose/code.
 * Outside code fences, leading whitespace from JSX nesting is removed. Inside
 * code fences, the body is dedented so the closing fence sits flush left.
 */
function stripMdxJsx(content: string): string {
  const segments = content.split(/(```[\s\S]*?```)/g)
  return segments
    .map((seg, i) => {
      if (i % 2 === 0) {
        let prose = seg
        prose = prose.replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
        prose = prose.replace(/<[$A-Z][\w.]*(?:\s[^>]*)?\s*\/>/gs, '')
        prose = prose.replace(/<[$A-Z][\w.]*(?:\s[^>]*)?\s*>/gs, '')
        prose = prose.replace(/<\/[$A-Z][\w.]*>/g, '')
        prose = prose.replace(/<\/?(?:div|a|span|p|h[1-6])(?:\s[^>]*)?\s*>/g, '')
        return prose.replace(/^[ \t]+/gm, '')
      }
      return seg.replace(
        /^(```[^\n]*\n)([\s\S]*?)(\n[ \t]*```)$/,
        (_, open, body) => open + dedentBlock(body) + '\n```'
      )
    })
    .join('')
    .replace(/^[^\S\n]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Read a `type: "markdown"` section's .mdx file and convert it to plain
 * markdown. Returns null if the file doesn't exist or has no usable content.
 */
async function renderMarkdownSection(mdxDir: string, section: Section): Promise<string | null> {
  if (!section.slug) return null
  let raw: string
  try {
    raw = await fs.readFile(path.join(mdxDir, `${section.slug}.mdx`), 'utf8')
  } catch {
    return null
  }
  const { content, data } = matter(raw)
  const body = stripMdxJsx(content)
  if (!body) return null
  const heading = data.hideTitle
    ? null
    : ((typeof data.title === 'string' ? data.title : section.title) ?? null)
  return heading ? `## ${heading}\n\n${body}` : body
}

async function renderSdkLegacy(ref: SdkLegacyRef, sharedTypeSpec: TypeSpec): Promise<string> {
  const [sections, functions] = await Promise.all([
    readJson<Section[]>(ref.sectionsPath),
    readJson<LegacyFn[]>(ref.functionsPath),
  ])
  const fnsById = new Map(functions.map((fn) => [fn.id, fn]))
  const methodsByRef = new Map(Object.entries(sharedTypeSpec.methods ?? {}))

  const parts: string[] = [`# ${ref.title}`]
  for (const section of flatten(sections)) {
    if (section.type === 'category' && section.title) {
      parts.push(`## ${section.title}`)
      continue
    }
    if (section.type === 'markdown') {
      const md = await renderMarkdownSection(ref.mdxDir, section)
      if (md) parts.push(md)
      continue
    }
    if (section.type !== 'function' || !section.id) continue
    const fn = fnsById.get(section.id)
    if (!fn) continue
    const tsm = fn.$ref ? methodsByRef.get(fn.$ref) : undefined
    parts.push(
      renderFunctionSection({
        title: fn.title || section.title || fn.id,
        description: fn.description ?? tsm?.comment?.shortText,
        notes: fn.notes,
        examples: fn.examples ?? tsm?.comment?.examples,
      })
    )
  }
  return parts.join('\n\n') + '\n'
}

async function renderSdkNew(ref: SdkNewRef): Promise<string> {
  const [sections, functions, typeSpec] = await Promise.all([
    readJson<Section[]>(path.join(ref.contentDir, 'sections.json')),
    readJson<LegacyFn[]>(path.join(ref.contentDir, 'functions.json')),
    readJson<TypeSpec>(path.join(ref.contentDir, 'typeSpec.json')),
  ])
  const fnsById = new Map(functions.map((fn) => [fn.id, fn]))
  const methods = typeSpec.methods ?? {}

  const parts: string[] = [`# ${ref.title}`]
  for (const section of flatten(sections)) {
    if (section.type === 'category' && section.title) {
      parts.push(`## ${section.title}`)
      continue
    }
    if (section.type === 'markdown') {
      const md = await renderMarkdownSection(ref.mdxDir, section)
      if (md) parts.push(md)
      continue
    }
    if (section.type !== 'function' || !section.id) continue
    const fn = fnsById.get(section.id)
    if (!fn) continue
    const tsm = fn.$ref ? methods[fn.$ref] : undefined
    parts.push(
      renderFunctionSection({
        title: fn.title || section.title || fn.id,
        description: fn.description ?? tsm?.comment?.shortText,
        notes: fn.notes,
        examples: fn.examples ?? tsm?.comment?.examples,
      })
    )
  }
  return parts.join('\n\n') + '\n'
}

async function renderApi(ref: ApiRef): Promise<string> {
  type Endpoint = {
    summary?: string
    description?: string
    path?: string
    method?: string
    parameters?: Array<{
      name: string
      required?: boolean
      description?: string
      schema?: { type?: string }
    }>
  }
  const [sections, entries] = await Promise.all([
    readJson<Section[]>(ref.sectionsPath),
    readJson<Array<[string, Endpoint]>>(ref.endpointsByIdPath),
  ])
  const endpointsById = new Map(entries)

  const parts: string[] = [`# ${ref.title}`]
  for (const section of flatten(sections)) {
    if (section.type === 'category' && section.title) {
      parts.push(`## ${section.title}`)
      continue
    }
    if (section.type === 'markdown') {
      const md = await renderMarkdownSection(ref.mdxDir, section)
      if (md) parts.push(md)
      continue
    }
    if (section.type !== 'operation' || !section.id) continue
    const ep = endpointsById.get(section.id)
    if (!ep) continue
    const heading = ep.summary || section.title || section.id
    const block = [`## ${heading}`]
    if (ep.path) block.push(`\`${(ep.method ?? 'GET').toUpperCase()} ${ep.path}\``)
    if (ep.description?.trim()) block.push(ep.description.trim())
    if (ep.parameters?.length) {
      const list = ep.parameters
        .map((p) => {
          const required = p.required ? 'required' : 'optional'
          const type = p.schema?.type ?? 'string'
          return `- \`${p.name}\` (${type}, ${required})${p.description ? `: ${p.description}` : ''}`
        })
        .join('\n')
      block.push(`### Parameters\n\n${list}`)
    }
    parts.push(block.join('\n\n'))
  }
  return parts.join('\n\n') + '\n'
}

async function renderCli(ref: CliRef): Promise<string> {
  type Command = {
    id: string
    title?: string
    summary?: string
    description?: string
    usage?: string
  }
  const [sections, spec] = await Promise.all([
    readJson<Section[]>(ref.sectionsPath),
    fs.readFile(ref.cliSpecPath, 'utf8').then((raw) => yaml.load(raw) as { commands: Command[] }),
  ])
  const cmdsById = new Map((spec.commands ?? []).map((c) => [c.id, c]))

  const parts: string[] = [`# ${ref.title}`]
  for (const section of flatten(sections)) {
    if (section.type === 'category' && section.title) {
      parts.push(`## ${section.title}`)
      continue
    }
    if (section.type === 'markdown') {
      const md = await renderMarkdownSection(ref.mdxDir, section)
      if (md) parts.push(md)
      continue
    }
    if (section.type !== 'cli-command' || !section.id) continue
    const cmd = cmdsById.get(section.id)
    if (!cmd) continue
    const block = [`## ${cmd.summary || cmd.title || section.title || section.id}`]
    if (cmd.description?.trim()) block.push(cmd.description.trim())
    if (cmd.usage?.trim()) block.push('```sh\n' + cmd.usage.trim() + '\n```')
    parts.push(block.join('\n\n'))
  }
  return parts.join('\n\n') + '\n'
}

async function generate() {
  await fs.mkdir(OUT_DIR, { recursive: true })
  const sharedTypeSpec = await readJson<TypeSpec>(
    path.join(process.cwd(), 'content/reference/javascript/v2/typeSpec.json')
  )

  const references = REFERENCES.filter((ref) => !ref.feature || isFeatureEnabled(ref.feature))

  await Promise.all(
    references.map(async (ref) => {
      let output: string
      switch (ref.kind) {
        case 'sdk-legacy':
          output = await renderSdkLegacy(ref, sharedTypeSpec)
          break
        case 'sdk-new':
          output = await renderSdkNew(ref)
          break
        case 'api':
          output = await renderApi(ref)
          break
        case 'cli':
          output = await renderCli(ref)
          break
      }
      const tree = fromMarkdown(output, {
        extensions: [gfm()],
        mdastExtensions: [gfmFromMarkdown()],
      })
      addBaseUrlPrefix(tree)
      const prefixed = toMarkdown(tree, {
        extensions: [gfmToMarkdown()],
        bullet: '-',
        listItemIndent: 'one',
      })
      await fs.writeFile(path.join(OUT_DIR, ref.outFile), prefixed)
    })
  )

  console.log(`Generated ${references.length} markdown files under public/markdown/reference/`)
}

generate()
