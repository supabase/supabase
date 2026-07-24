/**
 * Parsing + fetch helpers for supabase/changelog `entries/*.md` files, shared by:
 *  - lib/changelog-repo.ts (page rendering, via GitHub App fetch)
 *  - scripts/generateStaticContent.mjs (RSS + changelog.md static generation)
 *
 * Plain .mjs (no TypeScript syntax) so both a TS Next.js module and a plain
 * `node` build script can import it directly.
 */
import { Readable } from 'stream'
import zlib from 'zlib'
import matter from 'gray-matter'
import * as tarStream from 'tar-stream'

export const CHANGE_TYPE_LABELS = {
  'breaking-change': 'Breaking Change',
  deprecation: 'Deprecation',
  'new-feature': 'New Feature',
  improvement: 'Improvement',
  'bug-fix': 'Bug Fix',
  security: 'Security',
  policy: 'Policy',
}

/**
 * Fetches the whole repo as a single tarball and extracts `entries/*.md` in
 * memory. One API call regardless of entry count — fetching each file
 * individually (one request per entry) trips GitHub's secondary rate limit
 * once the entries directory grows past a couple hundred files.
 *
 * @param {import('@octokit/core').Octokit} octokit - already authenticated
 * @param {{ owner: string, repo: string, entriesPath?: string }} options
 * @returns {Promise<{ filename: string, content: string }[]>}
 */
export async function fetchChangelogEntryFilesFromTarball(
  octokit,
  { owner, repo, entriesPath = 'entries' }
) {
  const tarballRes = await octokit.request('GET /repos/{owner}/{repo}/tarball/{ref}', {
    owner,
    repo,
    ref: 'HEAD',
  })

  const gunzipped = zlib.gunzipSync(Buffer.from(tarballRes.data))
  const entryPathRe = new RegExp(`/${entriesPath}/([^/]+\\.md)$`)
  const extract = tarStream.extract()
  const files = []

  extract.on('entry', (header, stream, next) => {
    const match = header.type === 'file' ? header.name.match(entryPathRe) : null
    if (!match) {
      stream.resume()
      next()
      return
    }
    const chunks = []
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('end', () => {
      files.push({ filename: match[1], content: Buffer.concat(chunks).toString('utf8') })
      next()
    })
    stream.resume()
  })

  await new Promise((resolve, reject) => {
    extract.on('finish', resolve)
    extract.on('error', reject)
    Readable.from(gunzipped).pipe(extract)
  })

  return files
}

/**
 * The only frontmatter fields exposed to the browser. `matter()` also parses
 * private blocks like `internal:`, and the page ships `entry.frontmatter` into
 * props — so we allowlist to keep them out of the page source. Keep in sync with
 * `ChangelogEntryFrontmatter` in `changelog-repo.ts`.
 */
export const PUBLIC_FRONTMATTER_KEYS = [
  'title',
  'change_type',
  'product_stage',
  'affected_products',
  'affects_self_hosted',
  'version',
  'public',
  'publish_date',
  'sunset_date',
  'learn_more_url',
  'legacy_gh_discussion',
]

const DATE_FRONTMATTER_KEYS = new Set(['publish_date', 'sunset_date'])

/** Projects raw frontmatter to the public allowlist; date fields are stringified. */
export function toPublicFrontmatter(frontmatter) {
  const publicFrontmatter = {}
  for (const key of PUBLIC_FRONTMATTER_KEYS) {
    if (frontmatter[key] === undefined) continue
    publicFrontmatter[key] = DATE_FRONTMATTER_KEYS.has(key)
      ? toDateString(frontmatter[key])
      : frontmatter[key]
  }
  return publicFrontmatter
}

export function stripInternalBlock(body) {
  let sanitized = body.replace(/<!--\s*internal\s*-->[\s\S]*?<!--\s*\/internal\s*-->/gi, '')
  // MDX doesn't support raw HTML comments (only {/* */}) — strip any that are left
  // (e.g. author/template notes) so they can't break rendering. Applied repeatedly:
  // a single pass could in principle leave a fresh `<!-- ... -->` behind.
  let previous
  do {
    previous = sanitized
    sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, '')
  } while (sanitized !== previous)
  return sanitized.trim()
}

/**
 * Extracts the content under a `## <heading>` line.
 * @param {string[]} [stopAtHeadings] - exact heading names that terminate this section; omit to stop at any `##` line
 */
export function extractSection(markdown, heading, stopAtHeadings) {
  const stopClause = stopAtHeadings?.length
    ? stopAtHeadings.map((h) => `##\\s+${h}\\s*$`).join('|')
    : '##\\s+.*$'
  const regex = new RegExp(
    `^##\\s+${heading}\\s*\\n([\\s\\S]*?)(?=^(?:${stopClause})|(?![\\s\\S]))`,
    'im'
  )
  const match = markdown.match(regex)
  return match ? match[1].trim() : ''
}

function resolveDateFromFilename(filename) {
  const m = filename.match(/^(\d{4})(\d{2})(\d{2})-/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null
}

/**
 * Coerces a frontmatter date to `YYYY-MM-DD`. An unquoted YAML date parses to a
 * JS `Date`, which breaks the string sort and can't be serialized into props.
 */
function toDateString(value) {
  if (value == null) return null
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value)
}

/**
 * `legacy_gh_discussion-suffix` for backfilled entries
 * (preserves old supabase.com/changelog URLs)
 * or the filename without timestamp and extension.
 * */
export function computeChangelogEntrySlug(filename, frontmatter) {
  const base = filename.replace(/\.md$/, '')
  const suffixMatch = base.match(/^\d{8}-(.+)$/)
  const suffix = suffixMatch ? suffixMatch[1] : base
  if (frontmatter.legacy_gh_discussion) {
    return `${frontmatter.legacy_gh_discussion}-${suffix}`
  }
  return suffix
}

/** @param {string} filename @param {string} raw */
export function parseChangelogEntryFile(filename, raw) {
  const { data: frontmatter, content } = matter(raw)
  const publicBody = stripInternalBlock(content)

  return {
    slug: computeChangelogEntrySlug(filename, frontmatter),
    filename,
    frontmatter: toPublicFrontmatter(frontmatter),
    sortDate: toDateString(frontmatter.publish_date) ?? resolveDateFromFilename(filename) ?? '',
    summary: extractSection(publicBody, 'Summary'),
    bodySection: extractSection(publicBody, 'Body', ['Migration steps']),
    migrationSteps: extractSection(publicBody, 'Migration steps'),
  }
}

/** `public: true` and not scheduled for a future `publish_date`. */
export function isPublished(entry) {
  if (entry.frontmatter.public !== true) return false
  if (!entry.sortDate) return true
  return new Date(entry.sortDate).getTime() <= Date.now()
}

export function getPublishedChangelogEntries(files) {
  const entries = files
    .map(({ filename, content }) => parseChangelogEntryFile(filename, content))
    .filter(isPublished)
    .sort((a, b) => (a.sortDate < b.sortDate ? 1 : a.sortDate > b.sortDate ? -1 : 0))

  const filenameBySlug = new Map()
  for (const entry of entries) {
    const clashingFilename = filenameBySlug.get(entry.slug)
    if (clashingFilename) {
      throw new Error(
        `Duplicate changelog slug "${entry.slug}" from "${clashingFilename}" and "${entry.filename}"`
      )
    }
    filenameBySlug.set(entry.slug, entry.filename)
  }

  return entries
}
