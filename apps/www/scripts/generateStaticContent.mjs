// @ts-check

import fsSync, { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat.js'
import utc from 'dayjs/plugin/utc.js'
import matter from 'gray-matter'

/**
 * Plain `node` does not read `.env` / `.env.local` (Next.js loads those when you run `next`).
 * Minimal parser: no extra dependency; `.env` first, then `.env.local` overrides.
 */
function loadLocalEnvFiles(rootDir) {
  const parseValue = (raw) => {
    const val = raw.trim()
    if (val.startsWith('"') && val.endsWith('"')) {
      return val.slice(1, -1).replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
    }
    if (val.startsWith("'") && val.endsWith("'")) {
      return val.slice(1, -1).replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\\\/g, '\\')
    }
    return val
  }

  const applyLine = (line, override) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const eq = trimmed.indexOf('=')
    if (eq === -1) return
    const key = trimmed
      .slice(0, eq)
      .trim()
      .replace(/^export\s+/i, '')
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return
    const value = parseValue(trimmed.slice(eq + 1))
    if (override || process.env[key] === undefined) {
      process.env[key] = value
    }
  }

  for (const name of ['.env', '.env.local']) {
    try {
      const fp = path.join(rootDir, name)
      const raw = fsSync.readFileSync(fp, 'utf8')
      const override = name === '.env.local'
      for (const line of raw.split(/\r?\n/)) {
        applyLine(line, override)
      }
    } catch {
      /* file missing */
    }
  }
}

const wwwRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
loadLocalEnvFiles(wwwRoot)

dayjs.extend(utc)
dayjs.extend(advancedFormat)

// Constants
const FILENAME_SUBSTRING = 11 // based on YYYY-MM-DD format
const warnedBlogImageIssues = new Set()

const warnBlogImageIssue = (key, message) => {
  if (warnedBlogImageIssues.has(key)) return

  warnedBlogImageIssues.add(key)
  console.warn(message)
}

const validateBlogFrontmatterImages = (frontmatter, filePath) => {
  const hasImgSocial = typeof frontmatter.imgSocial !== 'undefined'
  const hasImgThumb = typeof frontmatter.imgThumb !== 'undefined'

  if (hasImgSocial && !hasImgThumb) {
    warnBlogImageIssue(
      `${filePath}:imgThumb:missing`,
      `[blog images] ${filePath}: missing "imgThumb". Adding it keeps on-site thumbnails separate from social previews.`
    )
  }

  if (hasImgThumb && !hasImgSocial) {
    warnBlogImageIssue(
      `${filePath}:imgSocial:missing`,
      `[blog images] ${filePath}: missing "imgSocial". Adding it keeps social previews separate from on-site thumbnails.`
    )
  }

  const imageFields = [
    ['imgSocial', frontmatter.imgSocial],
    ['imgThumb', frontmatter.imgThumb],
  ]

  for (const [fieldName, imageValue] of imageFields) {
    if (typeof imageValue === 'undefined') {
      continue
    }

    if (typeof imageValue !== 'string') {
      warnBlogImageIssue(
        `${filePath}:${fieldName}:invalid-type`,
        `[blog images] ${filePath}: "${fieldName}" should be a string URL or a relative blog image path.`
      )
      continue
    }

    const trimmedValue = imageValue.trim()

    if (!trimmedValue) {
      warnBlogImageIssue(
        `${filePath}:${fieldName}:empty`,
        `[blog images] ${filePath}: "${fieldName}" is empty. Remove it or provide a valid image path.`
      )
      continue
    }

    if (trimmedValue.startsWith('/images/blog/')) {
      warnBlogImageIssue(
        `${filePath}:${fieldName}:prefixed`,
        `[blog images] ${filePath}: "${fieldName}" should not include the "/images/blog/" prefix. Use a relative path like "my-post/og.png" instead.`
      )
    }

    if (trimmedValue.startsWith('./') || trimmedValue.startsWith('../')) {
      warnBlogImageIssue(
        `${filePath}:${fieldName}:relative-dot`,
        `[blog images] ${filePath}: "${fieldName}" should use a clean relative blog path, not "${trimmedValue}".`
      )
    }
  }
}

/**
 * Fixes Safari dates sorting bug
 */
const sortDates = (a, b, direction = 'desc') => {
  const isAsc = direction === 'asc'
  var reg = /-|:|T|\+/ //The regex on which matches the string should be split (any used delimiter) -> could also be written like /[.:T\+]/
  var parsed = [
    //an array which holds the date parts for a and b
    a.date.split(reg), //Split the datestring by the regex to get an array like [Year,Month,Day]
    b.date.split(reg),
  ]
  var dates = [
    //Create an array of dates for a and b
    new Date(parsed[0][0], parsed[0][1], parsed[0][2]), //Constructs an date of the above parsed parts (Year,Month...
    new Date(parsed[1][0], parsed[1][1], parsed[1][2]),
  ]
  return isAsc ? dates[0] - dates[1] : dates[1] - dates[0] //Returns the difference between the date (if b > a then a - b < 0)
}

/**
 * Get static blog posts from _blog directory
 */
const getStaticBlogPosts = () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const postDirectory = path.join(__dirname, '../_blog')

  try {
    const fileNames = fsSync.readdirSync(postDirectory)

    const allPosts = fileNames
      .filter((filename) => filename.endsWith('.mdx'))
      .map((filename) => {
        const slug = filename.replace('.mdx', '').substring(FILENAME_SUBSTRING)
        const fullPath = path.join(postDirectory, filename)

        // Extract contents of the MDX file
        const fileContents = fsSync.readFileSync(fullPath, 'utf8')
        const { data } = matter(fileContents)

        validateBlogFrontmatterImages(data, fullPath)

        const options = { month: 'long', day: 'numeric', year: 'numeric' }
        const formattedDate = new Date(data.date).toLocaleDateString('en-IN', options)

        return {
          slug,
          title: data.title,
          description: data.description,
          date: data.date,
          formattedDate,
          url: `/blog/${slug}`,
          isStatic: true,
          ...data,
        }
      })
      .filter((post) => post.title && post.description && post.date)

    return allPosts
  } catch (error) {
    console.warn('Error reading static blog posts:', error)
    return []
  }
}

/**
 * Get all blog posts from both sources
 */
const getAllBlogPosts = async () => {
  const staticPosts = getStaticBlogPosts()

  // Combine and sort all posts by date
  const allPosts = [...staticPosts]

  // Filter out posts without valid dates and sort
  const validPosts = allPosts.sort((a, b) => sortDates(a, b, 'desc'))

  return validPosts
}

/**
 * Get latest blog posts from both sources
 */
const getLatestBlogPosts = async () => {
  const allPosts = await getAllBlogPosts()

  // Return latest 10 posts
  const latestPosts = allPosts
    .slice(0, 10)
    .map(({ title, url, description, date, formattedDate }) => ({
      title,
      url,
      description,
      date,
      formattedDate,
    }))

  return latestPosts
}

let stars = 0

// GitHub Stars
const fetchOctoData = async () => {
  const { Octokit } = await import('@octokit/core')
  const octokit = new Octokit(process.env.GITHUB_TOKEN ? { auth: process.env.GITHUB_TOKEN } : {})
  const res = await octokit.request('GET /repos/{org}/{repo}', {
    org: 'supabase',
    repo: 'supabase',
    type: 'public',
  })

  return res.data?.stargazers_count
}

try {
  stars = await fetchOctoData()
} catch (error) {
  console.warn('Error fetching GitHub stars:', error)
}

// Careers Jobs count
const getCareerCount = async () => {
  try {
    const job_res = await fetch('https://api.ashbyhq.com/posting-api/job-board/supabase')
    const job_data = await job_res.json()
    return job_data.jobs.length
  } catch (error) {
    console.warn('Error fetching career count:', error)
    return 0
  }
}

let careersCount = 0

try {
  careersCount = await getCareerCount()
} catch (error) {
  console.warn('Error getting career count:', error)
}

// Get latest blog posts
let latestBlogPosts = []
try {
  latestBlogPosts = await getLatestBlogPosts()
} catch (error) {
  console.warn('Error getting latest blog posts:', error)
  latestBlogPosts = []
}

// Create folder for static content
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const folderPath = path.join(__dirname, '../.generated/staticContent')
try {
  await fs.mkdir(folderPath, { recursive: true })
} catch (error) {
  if (error.code !== 'EEXIST') {
    throw error
  }
  // Folder already exists, continue silently
}

// Write static content to file
const filePath = path.join(__dirname, '../.generated/staticContent/_index.json')
await fs.writeFile(
  filePath,
  JSON.stringify(
    {
      latestBlogPosts: latestBlogPosts,
      jobsCount: careersCount,
      githubStars: stars,
    },
    null,
    2
  ),
  'utf8'
)

console.log(`✅ Generated static content with ${latestBlogPosts.length} latest blog posts`)

// Generate blog and changelog RSS feed
try {
  const allBlogPosts = await getAllBlogPosts()

  // Transform posts to RSS format
  const xmlEncode = (str) => {
    if (str === undefined || str === null) {
      return ''
    }
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  const generateRssItem = (post) => {
    const encodedTitle = xmlEncode(post.title)
    const encodedPath = xmlEncode(post.path || post.url || `/blog/${post.slug}`)
    const encodedDescription = xmlEncode(post.description)
    const formattedDate = dayjs(post.date)
      .utcOffset(0, true)
      .startOf('day')
      .format('ddd, DD MMM YYYY HH:mm:ss [-0700]')

    return `<item>
  <guid>https://supabase.com${encodedPath}</guid>
  <title>${encodedTitle}</title>
  <link>https://supabase.com${encodedPath}</link>
  <description>${encodedDescription}</description>
  <pubDate>${formattedDate}</pubDate>
</item>
`
  }

  const formattedDate =
    allBlogPosts.length > 0
      ? dayjs(allBlogPosts[0].date)
          .utcOffset(0, true)
          .startOf('day')
          .format('ddd, DD MMM YYYY HH:mm:ss [-0700]')
      : dayjs().utcOffset(0, true).startOf('day').format('ddd, DD MMM YYYY HH:mm:ss [-0700]')

  const rss = `
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      <title>Supabase Blog</title>
      <link>https://supabase.com</link>
      <description>Latest news from Supabase</description>
      <language>en</language>
      <lastBuildDate>${formattedDate}</lastBuildDate>
      <atom:link href="https://supabase.com/rss.xml" rel="self" type="application/rss+xml"/>
      ${allBlogPosts.map(generateRssItem).join('')}
    </channel>
  </rss>
`

  // Write RSS feed to public directory
  const rssPath = path.join(__dirname, '../public/rss.xml')
  await fs.writeFile(rssPath, rss.trim(), 'utf8')
  console.log(`✅ Generated RSS feed with ${allBlogPosts.length} entries`)
} catch (error) {
  console.warn('Error generating RSS feed:', error)
}

// Changelog RSS + changelog.md → sourced from supabase/changelog entries/*.md (private repo).
// Missing secret: warns and skips outside Vercel, but fails Vercel builds so they can't
// publish stale generated changelog files. Generic CI (typecheck/lint on GitHub Actions)
// has no access to this secret and isn't publishing anything, so it only warns too.
async function generateChangelogContent() {
  const appId = process.env.CHANGELOG_SYNC_APP_ID
  const installationId = process.env.CHANGELOG_SYNC_APP_INSTALLATION_ID
  const privateKey = process.env.CHANGELOG_SYNC_APP_PRIVATE_KEY

  if (!appId || !installationId || !privateKey) {
    if (process.env.VERCEL) {
      throw new Error('CHANGELOG_SYNC_APP_* env vars not set — cannot generate changelog content')
    }
    console.warn('⚠️  CHANGELOG_SYNC_APP_* env vars not set — skipping changelog RSS/md generation')
    return
  }

  const { getPublishedChangelogEntries, fetchChangelogEntryFilesFromTarball, CHANGE_TYPE_LABELS } =
    await import('../lib/changelog-entries-core.mjs')
  const { generateChangelogRssXml, generateChangelogTagRssXml, labelToFileSlug } = await import(
    '../lib/changelog-rss.mjs'
  )
  const { createAppAuth } = await import('@octokit/auth-app')
  const { Octokit } = await import('@octokit/core')
  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: { appId, installationId, privateKey: privateKey.replace(/\\n/g, '\n') },
  })

  // Single tarball request — fetching each entry file individually trips
  // GitHub's secondary rate limit once the entries directory gets large.
  const files = await fetchChangelogEntryFilesFromTarball(octokit, {
    owner: 'supabase',
    repo: 'changelog',
    entriesPath: 'entries',
  })
  const entries = getPublishedChangelogEntries(files)

  const rssEntries = entries.map((entry) => ({
    slug: entry.slug,
    title: entry.frontmatter.title,
    sortDate: entry.sortDate,
    affectedProducts: entry.frontmatter.affected_products ?? [],
  }))

  const changelogXml = generateChangelogRssXml(rssEntries)
  const changelogRssPath = path.join(__dirname, '../public/changelog-rss.xml')
  await fs.writeFile(changelogRssPath, changelogXml.trim(), 'utf8')
  console.log(`✅ Generated changelog RSS with ${entries.length} entries`)

  // Per-tag feeds → public/changelog-rss/<label-slug>.xml
  const productTagsPath = path.join(__dirname, '../data/changelog-product-tags.json')
  const productTags = JSON.parse(await fs.readFile(productTagsPath, 'utf8'))
  const tagFeedsDir = path.join(__dirname, '../public/changelog-rss')
  // Clear first so a renamed/removed product tag doesn't leave a stale feed file behind.
  await fs.rm(tagFeedsDir, { recursive: true, force: true })
  await fs.mkdir(tagFeedsDir, { recursive: true })
  const tagFilenames = productTags.map(({ label }) => `${labelToFileSlug(label)}.xml`)
  const tagResults = await Promise.allSettled(
    productTags.map(async ({ label }) => {
      const fileSlug = labelToFileSlug(label)
      const tagXml = generateChangelogTagRssXml(rssEntries, { displayLabel: label })
      await fs.writeFile(path.join(tagFeedsDir, `${fileSlug}.xml`), tagXml.trim(), 'utf8')
    })
  )
  const failedTagFeeds = tagResults.flatMap((result, i) =>
    result.status === 'rejected' ? [{ file: tagFilenames[i], reason: result.reason }] : []
  )
  const succeeded = tagResults.length - failedTagFeeds.length
  console.log(`✅ Generated ${succeeded}/${productTags.length} per-tag changelog RSS feeds`)
  if (failedTagFeeds.length > 0) {
    for (const { file, reason } of failedTagFeeds) {
      console.error(`Failed to write changelog-rss/${file}:`, reason)
    }
    throw new Error(
      `Failed to generate ${failedTagFeeds.length}/${productTags.length} per-tag changelog RSS feeds`
    )
  }

  // LLM-friendly changelog markdown index (RSS remains canonical syndication format).
  const mdSections = entries.map((entry) => {
    const date = dayjs(entry.sortDate).isValid() ? dayjs(entry.sortDate).format('YYYY-MM-DD') : ''
    const changeType = CHANGE_TYPE_LABELS[entry.frontmatter.change_type] ?? entry.frontmatter.change_type
    const products = (entry.frontmatter.affected_products ?? []).join(', ')
    const meta = [
      date,
      changeType,
      products,
      `[supabase.com/changelog/${entry.slug}](https://supabase.com/changelog/${entry.slug})`,
    ]
      .filter(Boolean)
      .join(' · ')
    return [`## ${entry.frontmatter.title}`, meta, entry.summary].filter(Boolean).join('\n\n')
  })
  const changelogMd = `# Supabase Changelog\n\n${mdSections.join('\n\n---\n\n')}\n`
  const changelogMdPath = path.join(__dirname, '../public/changelog.md')
  await fs.writeFile(changelogMdPath, changelogMd, 'utf8')
  console.log(`✅ Generated changelog.md (${entries.length} entries)`)

  // One markdown file per entry → /changelog/<slug>.md (Body section only — internal notes never included).
  const changelogEntryMdDir = path.join(__dirname, '../public/changelog')
  // Clear first so a renamed/unpublished entry doesn't leave a stale file behind.
  await fs.rm(changelogEntryMdDir, { recursive: true, force: true })
  await fs.mkdir(changelogEntryMdDir, { recursive: true })
  for (const entry of entries) {
    const published = dayjs(entry.sortDate).isValid()
      ? dayjs(entry.sortDate).format('YYYY-MM-DD')
      : ''
    const titleLine = String(entry.frontmatter.title ?? '')
      .replace(/\n/g, ' ')
      .trim()
    const productsYaml = (entry.frontmatter.affected_products ?? [])
      .map((p) => `  - ${p}`)
      .join('\n')
    const pageUrl = `https://supabase.com/changelog/${entry.slug}`
    const entryMd = `---
slug: ${entry.slug}
published: ${published}
change_type: ${entry.frontmatter.change_type}
affected_products:
${productsYaml || '  []'}
page: ${pageUrl}
---

# ${titleLine}

${entry.bodySection}
`
    await fs.writeFile(
      path.join(changelogEntryMdDir, `${entry.slug}.md`),
      entryMd.trim() + '\n',
      'utf8'
    )
  }
  console.log(`✅ Generated changelog/*.md (${entries.length} files)`)
}
await generateChangelogContent()
