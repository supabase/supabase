#!/usr/bin/env node
// Post-build step: converts every rendered guide, topic, and troubleshooting
// page in dist/ into a plain .md file under dist/markdown/, for agents/tools
// that want the page's content without the site chrome. The HTML is converted
// with markdown-for-agents (`extract: true` keeps only the main content), so
// this has to run after `astro build` — see vercel.json for the redirect and
// negotiated rewrites that serve these files at `<page>.md`.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { convert } from 'markdown-for-agents'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'

import { BASE_PATH } from '../src/lib/constants.ts'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.join(SCRIPT_DIR, '..', 'dist')
const OUTPUT_DIR = path.join(DIST_DIR, 'markdown')

// One directory per route section in dist/, matching the vercel.json redirects.
const SECTIONS = ['guides', 'topics', 'troubleshooting']

// Used to turn root-relative links into full URLs so the exported file still
// makes sense read on its own.
const SITE_ORIGIN = 'https://supabase.com'

// Single processor reused for every file: parses GFM markdown to an mdast
// tree and serializes it back, same extensions on both ends so nothing
// (tables, strikethrough, alert blockquotes) gets mangled in the round trip.
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
 * Splits the YAML frontmatter block that markdown-for-agents prepends (from
 * the page's `<head>`) off the body, so the frontmatter isn't handed to the
 * markdown parser, which would read it as a thematic break and paragraphs.
 *
 * @param {string} markdown
 */
export function splitFrontmatter(markdown) {
  if (!markdown.startsWith('---\n')) return { frontmatter: '', body: markdown }

  const closingIndex = markdown.indexOf('\n---\n', 4)
  if (closingIndex === -1) return { frontmatter: '', body: markdown }

  const end = closingIndex + '\n---\n'.length
  return { frontmatter: markdown.slice(0, end), body: markdown.slice(end) }
}

/**
 * Converts a rendered HTML page to markdown. Only the page's main content is
 * kept (`extract: true` drops navigation, headers, footers, and sidebars), and
 * root-relative links in the body are absolutized.
 *
 * @param {string} html
 */
export function htmlToMarkdown(html) {
  const { markdown } = convert(html, { extract: true })
  const { frontmatter, body } = splitFrontmatter(markdown)
  return `${frontmatter}${absolutizeLinks(body)}`
}

/**
 * Maps a page's built HTML path (relative to dist/) to its markdown export
 * path, e.g. `guides/sample-guide/index.html` → `guides/sample-guide.md`.
 *
 * @param {string} htmlPath
 */
export function toMarkdownPath(htmlPath) {
  return `${path.dirname(htmlPath)}.md`
}

async function findIndexPages(dir) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }

  const files = await Promise.all(
    entries.map((entry) => {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) return findIndexPages(fullPath)
      if (entry.name === 'index.html') return [fullPath]
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
  const pages = (
    await Promise.all(SECTIONS.map((section) => findIndexPages(path.join(DIST_DIR, section))))
  ).flat()

  if (pages.length === 0) {
    throw new Error('No rendered pages found under dist/. Run `astro build` before this script.')
  }

  await Promise.all(
    pages.map(async (file) => {
      const html = await readFile(file, 'utf-8')
      const relativePath = path.relative(DIST_DIR, file)
      const outputPath = path.join(OUTPUT_DIR, toMarkdownPath(relativePath))
      await writeFileEnsuringDir(outputPath, htmlToMarkdown(html))
    })
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
