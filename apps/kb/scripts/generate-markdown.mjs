#!/usr/bin/env node
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

import { TOPICS, topicToSlug } from '../src/lib/topics.ts'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.join(SCRIPT_DIR, '..', 'src', 'content')
const OUTPUT_DIR = path.join(SCRIPT_DIR, '..', 'public', 'markdown')

// Production origin + Astro `base` — used to turn root-relative links into
// full URLs so the exported file still makes sense read on its own.
const SITE_ORIGIN = 'https://supabase.com'
const BASE_PATH = '/kb'

// Single processor reused for every file: parses GFM markdown to an mdast
// tree and serializes it back, same extensions on both ends so nothing
// (tables, strikethrough, alert blockquotes) gets mangled in the round trip.
// `emphasis`/`rule` match the markers content already uses (see
// src/content/guides/sample-guide.mdx) so the round trip doesn't normalize
// authors' `_italic_`/`---` into the serializer's own `*italic*`/`***`.
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
 * @param {string} raw
 */
export function parseFrontmatter(raw) {
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
 * @param {string} body
 */
export function absolutizeLinks(body) {
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
 *
 * @param {{ title?: string; description?: string }} data
 * @param {string} body
 */
export function renderMarkdown(data, body) {
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
 *
 * @param {{ name: string; description: string }} topic
 * @param {{ title: string; url: string }[]} guides
 */
export function renderTopicMarkdown(topic, guides) {
  const list = guides.length
    ? guides.map((guide) => `- [${guide.title}](${guide.url})`).join('\n')
    : 'No guides for this topic'
  return `# ${topic.name}\n\n${topic.description}\n\n${list}\n`
}

// file.mdx -> file.md, file.md -> file.md — no regex, just a suffix swap.
function toMdExtension(fileName) {
  if (fileName.endsWith('.mdx')) return `${fileName.slice(0, -'.mdx'.length)}.md`
  return fileName
}

// Strips the .md/.mdx extension off a content-relative path and turns it
// into the full, absolute URL of that page's markdown export.
function toGuideUrl(relativePath) {
  const posixPath = relativePath.split(path.sep).join('/')
  const withoutExt = toMdExtension(posixPath).slice(0, -'.md'.length)
  return `${SITE_ORIGIN}${BASE_PATH}/${withoutExt}.md`
}

async function findContentFiles(dir) {
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

async function writeFileEnsuringDir(outputPath, contents) {
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, contents)
}

async function main() {
  const files = await findContentFiles(CONTENT_DIR)

  // Only entries with a `topics` array (currently just the `guides`
  // collection) feed the per-topic index pages below.
  const guidesByTopic = new Map(TOPICS.map((topic) => [topic.name, []]))

  await Promise.all(
    files.map(async (file) => {
      const raw = await readFile(file, 'utf-8')
      const { data, body } = parseFrontmatter(raw)
      const relativePath = path.relative(CONTENT_DIR, file)

      const markdown = renderMarkdown(data, body)
      const outputPath = path.join(OUTPUT_DIR, toMdExtension(relativePath))
      await writeFileEnsuringDir(outputPath, markdown)

      if (!Array.isArray(data.topics)) return
      const guide = { title: data.title, url: toGuideUrl(relativePath) }
      for (const topicName of data.topics) {
        guidesByTopic.get(topicName)?.push(guide)
      }
    })
  )

  await Promise.all(
    TOPICS.map((topic) => {
      const markdown = renderTopicMarkdown(topic, guidesByTopic.get(topic.name))
      const outputPath = path.join(OUTPUT_DIR, 'topics', `${topicToSlug(topic.name)}.md`)
      return writeFileEnsuringDir(outputPath, markdown)
    })
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
