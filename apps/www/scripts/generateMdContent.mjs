// @ts-check

/**
 * Scans content/md/ (static markdown) plus _blog/, _customers/, _events/ (MDX)
 * and emits a TypeScript module exporting MD_CONTENT (slug → rendered markdown)
 * and MD_PAGES (allowlist Set used by middleware and the rel=alternate hook).
 *
 * Static imports of the generated file make the content traceable by
 * @vercel/nft so it ends up in the serverless bundle without runtime fs.readFile.
 *
 * Drop a new .md file in content/md/ — or a new .mdx in any registered MDX
 * section — and the route handler picks it up on the next content:build.
 */

import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'

import { mdxBodyToMarkdown } from './lib/mdxToMarkdown.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const wwwDir = path.join(__dirname, '..')
const contentDir = path.join(wwwDir, 'content/md')
const outputPath = path.join(wwwDir, 'app/api-v2/md/content.generated.ts')

// Slug prefix length for date-prefixed filenames (YYYY-MM-DD-, optionally
// followed by an extra '_' for events). Matches lib/posts.tsx FILENAME_SUBSTRING.
const DATE_PREFIX = 11

// 'pricing' is served dynamically via generatePricingContent() instead of
// from a .md file; it still needs to be in MD_PAGES so middleware rewrites
// /pricing.md to the API route.
const DYNAMIC_SLUGS = ['pricing']

// MDX sections. Slug shape: `<urlPrefix>/<filename-slug>`.
// urlPrefix matches the public URL path; the directory's leading '_' is dropped.
const MDX_SECTIONS = [
  {
    dir: '_blog',
    urlPrefix: 'blog',
    stripDatePrefix: true,
    frontmatterFields: ['title', 'description', 'author', 'date', 'tags', 'categories'],
  },
  {
    dir: '_customers',
    urlPrefix: 'customers',
    stripDatePrefix: false,
    frontmatterFields: [
      'name',
      'title',
      'description',
      'company_url',
      'industry',
      'region',
      'company_size',
      'supabase_products',
      'date',
    ],
  },
  {
    dir: '_events',
    urlPrefix: 'events',
    stripDatePrefix: true,
    frontmatterFields: [
      'title',
      'subtitle',
      'description',
      'type',
      'date',
      'end_date',
      'timezone',
      'duration',
      'onDemand',
    ],
    // Events with this flag are not built as HTML pages
    // (lib/posts.tsx and pages/events/[slug].tsx skip them); mirror that.
    skipIf: (data) => data.disable_page_build === true,
  },
]

async function collectMdFiles(dir, prefix = '') {
  const results = []
  let dirents
  try {
    dirents = await fs.readdir(dir, { withFileTypes: true })
  } catch (err) {
    if (err.code === 'ENOENT') return results
    throw err
  }
  for (const dirent of dirents) {
    const slug = prefix ? `${prefix}/${dirent.name}` : dirent.name
    if (dirent.isDirectory()) {
      results.push(...(await collectMdFiles(path.join(dir, dirent.name), slug)))
    } else if (dirent.name.endsWith('.md')) {
      results.push(slug.replace(/\.md$/, ''))
    }
  }
  return results
}

function deriveSlug(filename, stripDatePrefix) {
  const base = filename.replace(/\.mdx$/, '')
  if (!stripDatePrefix) return base
  // Strip YYYY-MM-DD prefix (11 chars). MUST match lib/posts.tsx exactly:
  //   filename.replace('.mdx', '').substring(FILENAME_SUBSTRING /* 11 */)
  // _events files use a double-underscore convention
  // (e.g., 2024-08-30__launch-...) which produces a slug with a leading
  // underscore (e.g., `_launch-...`). The HTML page lives at
  // `/events/_launch-...`, so we KEEP the underscore — stripping it would
  // produce a .md URL with no matching HTML page and orphan the
  // rel=alternate link.
  return base.substring(DATE_PREFIX)
}

// YAML-quote a scalar string only when needed (reserved chars, leading
// whitespace, or starts with `-`/`?`). For multi-line strings, fall back to
// JSON.stringify which preserves \n as an escape — agents can still parse it.
function yamlScalar(value) {
  if (typeof value !== 'string') return JSON.stringify(value)
  if (value.includes('\n')) return JSON.stringify(value)
  const needsQuote = /[:#&*!|>'%@`{}[\]]/.test(value) || /^[\s\-?]/.test(value)
  return needsQuote ? JSON.stringify(value) : value
}

function renderFrontmatter(data, fields) {
  const lines = []
  for (const field of fields) {
    const value = data[field]
    if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) continue
    if (Array.isArray(value)) {
      lines.push(`${field}: ${JSON.stringify(value)}`)
    } else if (typeof value === 'object') {
      // Reject nested-object fields rather than emit ad-hoc YAML. Section
      // configs whitelist scalar/array/date fields only; if a future config
      // adds a nested object, decide its serialization deliberately.
      throw new Error(
        `renderFrontmatter: nested object for field "${field}" is not supported. ` +
          `Add explicit handling or flatten upstream.`
      )
    } else {
      lines.push(`${field}: ${yamlScalar(value)}`)
    }
  }
  return lines.length > 0 ? `---\n${lines.join('\n')}\n---\n\n` : ''
}

async function ingestMdxSection(section) {
  const dir = path.join(wwwDir, section.dir)
  let filenames
  try {
    filenames = await fs.readdir(dir)
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn(`  ⚠ Section directory missing: ${section.dir}`)
      return []
    }
    throw err
  }

  const mdxFilenames = filenames.filter((f) => f.endsWith('.mdx'))

  // Parse + serialize files in parallel; the unified processor is stateless
  // between calls and the I/O dominates wall-clock at 405+ files.
  const results = await Promise.all(
    mdxFilenames.map(async (filename) => {
      const fullPath = path.join(dir, filename)
      const raw = await fs.readFile(fullPath, 'utf-8')
      const parsed = matter(raw)
      const data = parsed.data ?? {}

      if (section.skipIf?.(data)) return null

      const fileSlug = deriveSlug(filename, section.stripDatePrefix)
      const slug = `${section.urlPrefix}/${fileSlug}`
      const preamble = renderFrontmatter(data, section.frontmatterFields)
      const body = await mdxBodyToMarkdown(parsed.content)
      return { slug, content: preamble + body }
    })
  )

  return results.filter((entry) => entry !== null)
}

// homepage first (it's the site overview), then everything else alphabetical.
function sortSlugs(a, b) {
  if (a === 'homepage') return -1
  if (b === 'homepage') return 1
  return a.localeCompare(b)
}

const staticSlugs = (await collectMdFiles(contentDir)).sort(sortSlugs)

if (staticSlugs.length === 0) {
  console.error('❌ No .md files found in content/md/')
  process.exit(1)
}

const staticEntries = await Promise.all(
  staticSlugs.map(async (slug) => {
    const filePath = path.join(contentDir, `${slug}.md`)
    const content = await fs.readFile(filePath, 'utf-8')
    return { slug, content }
  })
)

const mdxEntries = []
for (const section of MDX_SECTIONS) {
  console.log(`📚 Ingesting ${section.dir}...`)
  const sectionEntries = await ingestMdxSection(section)
  console.log(`   ${sectionEntries.length} entries`)
  mdxEntries.push(...sectionEntries)
}

const allEntries = [...staticEntries, ...mdxEntries]

// A static file with the same slug as a dynamic generator would land in both
// MD_CONTENT and the dynamic append path. Fail the build instead.
const dynamicCollisions = staticSlugs.filter((s) => DYNAMIC_SLUGS.includes(s))
if (dynamicCollisions.length > 0) {
  console.error(
    `❌ Slug collision: [${dynamicCollisions.join(', ')}] is reserved for a dynamic generator. ` +
      `Remove the corresponding file from content/md/ or update DYNAMIC_SLUGS.`
  )
  process.exit(1)
}

// A top-level static or dynamic slug equal to a section root (e.g.,
// `content/md/blog.md`) would shadow the entire `blog/` namespace.
const sectionRoots = MDX_SECTIONS.map((s) => s.urlPrefix)
const sectionRootCollisions = [...staticSlugs, ...DYNAMIC_SLUGS].filter((s) =>
  sectionRoots.includes(s)
)
if (sectionRootCollisions.length > 0) {
  console.error(
    `❌ Section-root collision: [${sectionRootCollisions.join(', ')}] would shadow an MDX section root.`
  )
  process.exit(1)
}

// Two MDX files producing the same slug (e.g., date-prefix collision) would
// silently drop one. Catch it.
const seen = new Set()
for (const entry of allEntries) {
  if (seen.has(entry.slug)) {
    console.error(`❌ Duplicate slug emitted: ${entry.slug}`)
    process.exit(1)
  }
  seen.add(entry.slug)
}

const contentEntries = allEntries
  .map((e) => `  [${JSON.stringify(e.slug)}, ${JSON.stringify(e.content)}]`)
  .join(',\n')

const allPageSlugs = [...allEntries.map((e) => e.slug), ...DYNAMIC_SLUGS]
const pageEntries = allPageSlugs.map((s) => `  ${JSON.stringify(s)}`).join(',\n')

const output = `// AUTO-GENERATED by scripts/generateMdContent.mjs — do not edit
export const MD_CONTENT = new Map<string, string>([
${contentEntries},
])

export const MD_PAGES = new Set<string>([
${pageEntries},
])
`

await fs.writeFile(outputPath, output, 'utf-8')
console.log(`✅ Generated ${outputPath} (${allEntries.length} files, ${allPageSlugs.length} pages)`)
