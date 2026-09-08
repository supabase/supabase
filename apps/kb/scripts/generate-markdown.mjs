#!/usr/bin/env node
// Pre-build step: exports every src/content/**/*.{md,mdx} file as a plain
// .md file under public/markdown/, for agents/tools that want the raw
// content instead of the rendered page (same idea as apps/docs' guides
// markdown export, recreated here at a much smaller scale — see
// vercel.json for the redirect that serves it at `<page>.md`).
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import YAML from 'yaml'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.join(SCRIPT_DIR, '..', 'src', 'content')
const OUTPUT_DIR = path.join(SCRIPT_DIR, '..', 'public', 'markdown')

// Production origin + Astro `base` — used to turn root-relative links into
// full URLs so the exported file still makes sense read on its own.
const SITE_ORIGIN = 'https://supabase.com'
const BASE_PATH = '/kb'

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
 * Rewrites root-relative markdown links (`](/some/path)`) into full,
 * absolute URLs — the same "show full URLs" transform apps/docs applies
 * to its own markdown export, so links still resolve when this file is
 * read outside of the site.
 *
 * @param {string} body
 */
export function absolutizeLinks(body) {
  return body.replace(/\]\((\/[^)\s]+)\)/g, (_match, href) => {
    const withBase =
      href === BASE_PATH || href.startsWith(`${BASE_PATH}/`) ? href : `${BASE_PATH}${href}`
    return `](${SITE_ORIGIN}${withBase})`
  })
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
  return `${heading}${lead}${absolutizeLinks(body.trim())}\n`
}

// file.mdx -> file.md, file.md -> file.md — no regex, just a suffix swap.
function toMdExtension(fileName) {
  if (fileName.endsWith('.mdx')) return `${fileName.slice(0, -'.mdx'.length)}.md`
  return fileName
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

async function main() {
  const files = await findContentFiles(CONTENT_DIR)

  await Promise.all(
    files.map(async (file) => {
      const raw = await readFile(file, 'utf-8')
      const { data, body } = parseFrontmatter(raw)
      const markdown = renderMarkdown(data, body)

      const relativePath = toMdExtension(path.relative(CONTENT_DIR, file))
      const outputPath = path.join(OUTPUT_DIR, relativePath)
      await mkdir(path.dirname(outputPath), { recursive: true })
      await writeFile(outputPath, markdown)
    })
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
