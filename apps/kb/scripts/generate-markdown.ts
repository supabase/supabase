// Pre-build step: exports every src/content/**/*.{md,mdx} file as a plain
// .md file under public/markdown/, for agents/tools that want the raw
// content instead of the rendered page (same idea as apps/docs' guides
// markdown export, recreated here at a much smaller scale — see
// vercel.json for the redirect that serves it at `<page>.md`).
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import YAML from 'yaml'

import { BASE_PATH } from '../src/lib/constants.ts'
import { isInTopic, TOPICS, topicToSlug, type Topic } from '../src/lib/topics.ts'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.join(SCRIPT_DIR, '..', 'src', 'content')
const OUTPUT_DIR = path.join(SCRIPT_DIR, '..', 'public', 'markdown')

// Used to turn root-relative links into full URLs so the exported file still
// makes sense read on its own.
const SITE_ORIGIN = 'https://supabase.com'

const SITE_TITLE = 'Supabase Knowledge Base'
const SITE_DESCRIPTION =
  'In-depth guides, tutorials, troubleshooting, and explainers for best practices for Supabase'

interface Frontmatter {
  title?: string
  description?: string
  topics?: unknown
  [key: string]: unknown
}

interface Entry {
  title: string
  url: string
}

// Single processor reused for every file: parses GFM markdown to an mdast
// tree and serializes it back, same extensions on both ends so nothing
// (tables, strikethrough, alert blockquotes) gets mangled in the round trip.
// `emphasis`/`rule` match the markers content already uses, so the round trip
// doesn't normalize authors' `_italic_`/`---` into the serializer's own `*italic*`/`***`.
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkStringify, { bullet: '-', listItemIndent: 'one', emphasis: '_', rule: '-' })

/**
 * Absolute base URL to prepend to root-relative links, mirroring apps/docs'
 * `getInternalLinkBaseUrl()`. Empty in local dev/CI (outside Vercel), which
 * keeps links relative there — resolved instead against whatever host is
 * serving the build.
 *
 * Resolution order:
 *  - `VERCEL_ENV=production` → `https://supabase.com`
 *  - `VERCEL_ENV=preview`    → `https://${VERCEL_URL}`
 *  - anything else          → ''
 */
export function getInternalLinkBaseUrl() {
  const env = process.env.VERCEL_ENV
  if (env === 'production') return SITE_ORIGIN
  if (env === 'preview' && process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return ''
}

/**
 * Splits a `.md`/`.mdx` file's raw text into its YAML frontmatter (parsed
 * to a plain object) and the remaining body. The delimiters are located
 * with plain string ops, and the frontmatter itself is parsed with a real
 * YAML parser — no regex involved in extracting values.
 *
 */
export function parseFrontmatter(raw: string): { data: Frontmatter; body: string } {
  if (!raw.startsWith('---\n')) return { data: {}, body: raw }

  const frontmatterEnd = raw.indexOf('\n---', 4)
  if (frontmatterEnd === -1) return { data: {}, body: raw }

  const yamlText = raw.slice(4, frontmatterEnd)
  const bodyStart = raw.indexOf('\n', frontmatterEnd + 1)
  const body = bodyStart === -1 ? '' : raw.slice(bodyStart + 1)

  return { data: YAML.parse(yamlText) ?? {}, body }
}

/**
 * Rewrites root-relative markdown links into full, absolute URLs by parsing
 * the body to an mdast tree, visiting its `link` nodes, and serializing it
 * back — the AST equivalent of apps/docs' `addBaseUrlPrefix()`, so this file
 * still makes sense read outside of the site (no regex over the raw text).
 *
 */
export function absolutizeLinks(body: string): string {
  const tree = processor.parse(body)
  const baseUrl = getInternalLinkBaseUrl()

  visit(tree, 'link', (node) => {
    if (!node.url.startsWith('/') || node.url.startsWith('//')) return
    const withBase =
      node.url === BASE_PATH || node.url.startsWith(`${BASE_PATH}/`)
        ? node.url
        : `${BASE_PATH}${node.url}`
    node.url = `${baseUrl}${withBase}`
  })

  return String(processor.stringify(tree))
}

/**
 * Renders the simplified export: the frontmatter title as an h1, the
 * description as the paragraph beneath it, then the (link-absolutized)
 * body.
 */
export function renderMarkdown(data: Frontmatter, body: string): string {
  const heading = data.title ? `# ${data.title}\n\n` : ''
  const lead = data.description ? `${data.description}\n\n` : ''
  // absolutizeLinks() already normalizes to exactly one trailing newline
  // (remark-stringify's doing, not ours) — no extra "\n" needed here.
  return `${heading}${lead}${absolutizeLinks(body.trim())}`
}

/**
 * Renders a topic index: its name as an h1, its description as the
 * paragraph beneath it, then a bullet list linking to every guide tagged
 * with that topic — same data `src/pages/topics/[topic].astro` renders,
 * as a plain markdown page.
 */
export function renderTopicMarkdown(
  topic: { name: string; description: string },
  guides: Entry[]
): string {
  const list = guides.length
    ? guides.map((guide) => `- [${guide.title}](${guide.url})`).join('\n')
    : 'No guides for this topic'
  return `# ${topic.name}\n\n${topic.description}\n\n${list}\n`
}

const renderLinkList = (entries: Entry[]) =>
  entries.length
    ? entries.map((entry) => `- [${entry.title}](${entry.url})`).join('\n')
    : 'No entries'

/**
 * Renders the root sitemap: the site title as an h1 with its description
 * beneath, then one section per kind of page (topics, troubleshooting
 * articles, guides), each a bullet list of links to the `.md` exports.
 */
export function renderSitemapMarkdown({
  topics,
  troubleshooting,
  guides,
}: {
  topics: Entry[]
  troubleshooting: Entry[]
  guides: Entry[]
}): string {
  return (
    [
      `# ${SITE_TITLE}`,
      SITE_DESCRIPTION,
      '## Topics',
      renderLinkList(topics),
      '## Troubleshooting',
      renderLinkList(troubleshooting),
      '## Guides',
      renderLinkList(guides),
    ].join('\n\n') + '\n'
  )
}

// file.mdx -> file.md, file.md -> file.md — no regex, just a suffix swap.
function toMdExtension(fileName: string): string {
  if (fileName.endsWith('.mdx')) return `${fileName.slice(0, -'.mdx'.length)}.md`
  return fileName
}

// Strips the .md/.mdx extension off a content-relative path and turns it
// into the full, absolute URL of that page's markdown export.
function toMdUrl(relativePath: string): string {
  const posixPath = relativePath.split(path.sep).join('/')
  const withoutExt = toMdExtension(posixPath).slice(0, -'.md'.length)
  return `${SITE_ORIGIN}${BASE_PATH}/${withoutExt}.md`
}

const byTitle = (a: Entry, b: Entry) => a.title.localeCompare(b.title)

async function findContentFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map((entry) => {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) return findContentFiles(fullPath)
      if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) return [fullPath]
      return []
    })
  )
  return files.flat()
}

async function writeFileEnsuringDir(outputPath: string, contents: string) {
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, contents)
}

async function main() {
  const files = await findContentFiles(CONTENT_DIR)

  const guidesByTopic = new Map<Topic, Entry[]>(TOPICS.map((topic) => [topic.name, []]))
  const entriesByCollection: Record<string, Entry[]> = { guides: [], troubleshooting: [] }

  await Promise.all(
    files.map(async (file) => {
      const raw = await readFile(file, 'utf-8')
      const { data, body } = parseFrontmatter(raw)
      const relativePath = path.relative(CONTENT_DIR, file)

      const markdown = renderMarkdown(data, body)
      const outputPath = path.join(OUTPUT_DIR, toMdExtension(relativePath))
      await writeFileEnsuringDir(outputPath, markdown)

      // the first folder under src/content is the collection, e.g. guides or troubleshooting
      const collection = relativePath.split(path.sep)[0] as 'guides' | 'troubleshooting'
      const topics: string[] = Array.isArray(data.topics) ? data.topics : []
      const entry: Entry = { title: data.title ?? relativePath, url: toMdUrl(relativePath) }
      entriesByCollection[collection]?.push(entry)
      for (const { name } of TOPICS) {
        if (isInTopic({ collection, topics, topic: name })) guidesByTopic.get(name)!.push(entry)
      }
    })
  )

  const topicEntries: Entry[] = TOPICS.map((topic) => ({
    title: topic.name,
    url: toMdUrl(`topics/${topicToSlug(topic.name)}.md`),
  }))

  await Promise.all([
    ...TOPICS.map((topic) => {
      const markdown = renderTopicMarkdown(topic, guidesByTopic.get(topic.name)!)
      const outputPath = path.join(OUTPUT_DIR, 'topics', `${topicToSlug(topic.name)}.md`)
      return writeFileEnsuringDir(outputPath, markdown)
    }),
    writeFileEnsuringDir(
      path.join(OUTPUT_DIR, 'sitemap.md'),
      renderSitemapMarkdown({
        topics: topicEntries,
        troubleshooting: entriesByCollection.troubleshooting.sort(byTitle),
        guides: entriesByCollection.guides.sort(byTitle),
      })
    ),
  ])
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
