// @ts-check

/**
 * Scans content/md/ + _blog/ + _customers/ + _events/ and emits a TypeScript
 * module exporting MD_CONTENT (slug → markdown) and MD_PAGES (allowlist Set).
 * The static import keeps content traceable by @vercel/nft, no runtime fs reads.
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

// Matches lib/posts.tsx FILENAME_SUBSTRING — strips YYYY-MM-DD- (11 chars).
const DATE_PREFIX = 11

// Slugs handled by a dynamic generator in the route handler. Listed here so
// MD_PAGES still includes them (middleware relies on the allowlist).
const DYNAMIC_SLUGS = ['pricing']

function pickFields(data, fields) {
  const picked = {}
  for (const field of fields) {
    const value = data[field]
    if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) continue
    picked[field] = value
  }
  return picked
}

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

// _events double-underscore filenames (`2024-08-30__launch-...`) produce slugs
// with a leading underscore. The HTML page is at `/events/_launch-...`, so the
// .md slug must keep the underscore to match.
function deriveSlug(filename, stripDatePrefix) {
  const base = filename.replace(/\.mdx$/, '')
  return stripDatePrefix ? base.substring(DATE_PREFIX) : base
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
  const results = await Promise.all(
    mdxFilenames.map(async (filename) => {
      const fullPath = path.join(dir, filename)
      try {
        const raw = await fs.readFile(fullPath, 'utf-8')
        const parsed = matter(raw)
        const data = parsed.data ?? {}
        if (section.skipIf?.(data)) return null

        const slug = `${section.urlPrefix}/${deriveSlug(filename, section.stripDatePrefix)}`
        const body = await mdxBodyToMarkdown(parsed.content)
        const content = matter.stringify(body, pickFields(data, section.frontmatterFields))
        return { slug, content }
      } catch (err) {
        throw new Error(`${section.dir}/${filename}: ${err.message}`, { cause: err })
      }
    })
  )
  return results.filter((entry) => entry !== null)
}

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
  staticSlugs.map(async (slug) => ({
    slug,
    content: await fs.readFile(path.join(contentDir, `${slug}.md`), 'utf-8'),
  }))
)

const mdxEntries = []
for (const section of MDX_SECTIONS) {
  console.log(`📚 Ingesting ${section.dir}...`)
  const sectionEntries = await ingestMdxSection(section)
  console.log(`   ${sectionEntries.length} entries`)
  mdxEntries.push(...sectionEntries)
}

const allEntries = [...staticEntries, ...mdxEntries]

const dynamicCollisions = staticSlugs.filter((s) => DYNAMIC_SLUGS.includes(s))
if (dynamicCollisions.length > 0) {
  console.error(
    `❌ Slug collision: [${dynamicCollisions.join(', ')}] reserved for a dynamic generator.`
  )
  process.exit(1)
}

const sectionRoots = MDX_SECTIONS.map((s) => s.urlPrefix)
const sectionRootCollisions = [...staticSlugs, ...DYNAMIC_SLUGS].filter((s) =>
  sectionRoots.includes(s)
)
if (sectionRootCollisions.length > 0) {
  console.error(
    `❌ Section-root collision: [${sectionRootCollisions.join(', ')}] shadows an MDX section.`
  )
  process.exit(1)
}

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
