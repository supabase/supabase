#!/usr/bin/env node
// Post-build step: converts every rendered guide and topic page in dist/ into
// a plain .md file under dist/markdown/, for agents/tools that want the
// content instead of the rendered page. The HTML is converted with
// markdown-for-agents (extract mode drops the header/footer), so the export
// matches what the page actually renders. vercel.json redirects `<page>.md`
// requests to these files.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { convert, createRule } from 'markdown-for-agents'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.join(SCRIPT_DIR, '..', 'dist')
const OUTPUT_DIR = path.join(DIST_DIR, 'markdown')

// Astro output sections that get a markdown export, mirroring the redirect
// sections in vercel.json.
const SECTIONS = ['guides', 'topics']

// Production origin + Astro `base` — used to turn root-relative links into
// full URLs so the exported file still makes sense read on its own.
const SITE_ORIGIN = 'https://supabase.com'
const BASE_PATH = '/kb'

// Matches links to other guide/topic pages (no hash, no query, no .md yet).
const INTERNAL_PAGE_HREF = new RegExp(`^${BASE_PATH}/(${SECTIONS.join('|')})/[^#?]+$`)

// Maps the Admonition labels (see packages/ui-patterns/src/Admonition) back to
// the GitHub alert markers that src/lib/mdx/rehype-admonitions.ts reads.
const ALERT_MARKER_BY_LABEL = {
  Note: 'NOTE',
  Success: 'TIP',
  Warning: 'IMPORTANT',
  Danger: 'WARNING',
  Caution: 'CAUTION',
}

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

// Internal guide/topic links point at their markdown export, so an agent that
// follows a link stays in markdown. Everything else goes through the
// library's default link handling (with `baseUrl` making it absolute).
const internalPageLinkRule = createRule(
  (node) => node.name === 'a' && INTERNAL_PAGE_HREF.test(node.attribs.href ?? ''),
  ({ node, convertChildren }) => {
    const url = `${getInternalLinkBaseUrl()}${node.attribs.href}.md`
    const title = node.attribs.title ? ` "${node.attribs.title.replaceAll('"', '\\"')}"` : ''
    return `[${convertChildren(node).trim()}](${url}${title})`
  }
)

// Admonitions render as `<div data-slot="alert" aria-label="Note">`. Turn them
// back into GitHub alert blockquotes so the export keeps the callout type.
const admonitionRule = createRule(
  (node) => node.name === 'div' && node.attribs['data-slot'] === 'alert',
  ({ node, convertChildren }) => {
    const quoted = []
    for (const line of convertChildren(node).trim().split('\n')) {
      const isBlank = line.trim() === ''
      if (isBlank && quoted.at(-1) === '>') continue
      quoted.push(isBlank ? '>' : `> ${line}`)
    }
    const marker = ALERT_MARKER_BY_LABEL[node.attribs['aria-label']]
    const header = marker ? `> [!${marker}]\n` : ''
    return `\n\n${header}${quoted.join('\n')}\n\n`
  }
)

/**
 * Converts one rendered page's HTML into its markdown export.
 *
 * @param {string} html
 */
export function renderPageMarkdown(html) {
  const { markdown } = convert(html, {
    extract: true,
    frontmatter: false,
    baseUrl: getInternalLinkBaseUrl() || undefined,
    rules: [internalPageLinkRule, admonitionRule],
  })
  return `${markdown.trim()}\n`
}

async function findIndexPages(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const pages = await Promise.all(
    entries.map((entry) => {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) return findIndexPages(fullPath)
      return entry.name === 'index.html' ? [fullPath] : []
    })
  )
  return pages.flat()
}

async function writeFileEnsuringDir(outputPath, contents) {
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, contents)
}

async function main() {
  await Promise.all(
    SECTIONS.map(async (section) => {
      const sectionDir = path.join(DIST_DIR, section)
      const pages = await findIndexPages(sectionDir)

      await Promise.all(
        pages.map(async (page) => {
          // dist/guides/<slug>/index.html -> <slug>
          const pageDir = path.relative(sectionDir, path.dirname(page))
          if (!pageDir) return

          const html = await readFile(page, 'utf-8')
          const outputPath = path.join(OUTPUT_DIR, section, `${pageDir}.md`)
          await writeFileEnsuringDir(outputPath, renderPageMarkdown(html))
        })
      )
    })
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
