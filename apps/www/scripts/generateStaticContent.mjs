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
  const octokit = new Octokit()
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

// Changelog RSS → public/changelog-rss.xml (same GitHub App + category as lib/changelog-github.ts)
try {
  const appId = process.env.GITHUB_CHANGELOG_APP_ID
  const installationId = process.env.GITHUB_CHANGELOG_APP_INSTALLATION_ID
  const privateKey = process.env.GITHUB_CHANGELOG_APP_PRIVATE_KEY

  if (!appId || !installationId || !privateKey) {
    console.warn('Skipping changelog RSS: missing GITHUB_CHANGELOG_APP_* env vars')
  } else {
    const { createAppAuth } = await import('@octokit/auth-app')
    const { Octokit } = await import('@octokit/core')
    const { paginateGraphql } = await import('@octokit/plugin-paginate-graphql')

    const { generateChangelogRssXml, generateChangelogTagRssXml, labelToFileSlug, changelogEntrySlug } =
      await import('../lib/changelog-rss.mjs')
    const rewritesPath = path.join(__dirname, 'data/changelog-deleted-discussions.json')
    const rewrites = JSON.parse(await fs.readFile(rewritesPath, 'utf8'))
    const discussionDisplayDate = (item) => {
      const dateRewrite = rewrites.find(
        (r) => item.title && r.title && item.title.includes(r.title)
      )
      return dateRewrite ? dateRewrite.createdAt : item.createdAt
    }

    const CHANGELOG_CATEGORY_ID = 'DIC_kwDODMpXOc4CAFUr'

    const changelogQuery = `
    query changelogDiscussionMetadata($cursor: String, $owner: String!, $repo: String!, $categoryId: ID!) {
      repository(owner: $owner, name: $repo) {
        discussions(
          first: 100
          after: $cursor
          categoryId: $categoryId
          orderBy: { field: CREATED_AT, direction: DESC }
        ) {
          nodes {
            number
            title
            body
            createdAt
            url
            labels(first: 25) {
              nodes {
                name
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `

    const ExtendedOctokit = Octokit.plugin(paginateGraphql)
    const octokit = new ExtendedOctokit({
      authStrategy: createAppAuth,
      auth: {
        appId,
        installationId,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      },
    })

    const collected = []
    let cursor = null
    let hasNextPage = true
    while (hasNextPage) {
      const {
        repository: {
          discussions: { nodes, pageInfo },
        },
      } = await octokit.graphql(changelogQuery, {
        owner: 'supabase',
        repo: 'supabase',
        categoryId: CHANGELOG_CATEGORY_ID,
        cursor,
      })
      collected.push(...nodes)
      hasNextPage = pageInfo.hasNextPage
      cursor = pageInfo.endCursor
    }

    const entries = collected.map((item) => ({
      number: item.number,
      slug: changelogEntrySlug(item.number, item.title),
      title: item.title,
      url: item.url,
      sortDate: discussionDisplayDate({ title: item.title, createdAt: item.createdAt }),
      labels: (item.labels?.nodes ?? []).map((l) => l.name.toLowerCase()),
      body: item.body ?? '',
    }))

    const changelogXml = generateChangelogRssXml(entries)
    const changelogRssPath = path.join(__dirname, '../public/changelog-rss.xml')
    await fs.writeFile(changelogRssPath, changelogXml.trim(), 'utf8')
    const visibleCount = entries.filter((e) => !e.title.includes('[d]')).length
    console.log(`✅ Generated changelog RSS with ${visibleCount} entries`)

    // Per-tag feeds → public/changelog-rss/<label-slug>.xml
    const productTagsPath = path.join(__dirname, '../data/changelog-product-tags.json')
    const productTags = JSON.parse(await fs.readFile(productTagsPath, 'utf8'))
    const tagFeedsDir = path.join(__dirname, '../public/changelog-rss')
    await fs.mkdir(tagFeedsDir, { recursive: true })
    const tagResults = await Promise.allSettled(
      productTags.map(async ({ slug, label }) => {
        const fileSlug = labelToFileSlug(label)
        const tagXml = generateChangelogTagRssXml(entries, {
          githubLabelSlug: slug,
          displayLabel: label,
        })
        await fs.writeFile(path.join(tagFeedsDir, `${fileSlug}.xml`), tagXml.trim(), 'utf8')
      })
    )
    const succeeded = tagResults.filter((r) => r.status === 'fulfilled').length
    console.log(`✅ Generated ${succeeded}/${productTags.length} per-tag changelog RSS feeds`)

    // LLM-friendly changelog markdown index (RSS remains canonical syndication format).
    const visibleEntries = entries.filter((entry) => !entry.title.includes('[d]'))

    /**
     * Extracts the first meaningful paragraph from a markdown body.
     * Skips headings, code fences, HTML blocks, and empty lines.
     */
    const extractSummary = (body) => {
      if (!body) return ''
      for (const para of body.split(/\n{2,}/)) {
        const trimmed = para.trim()
        if (
          !trimmed ||
          trimmed.startsWith('#') ||
          trimmed.startsWith('```') ||
          trimmed.startsWith('<') ||
          trimmed.startsWith('|') ||
          trimmed.startsWith('---')
        ) continue
        const oneLiner = trimmed.replace(/\n/g, ' ')
        return oneLiner.length > 200 ? oneLiner.slice(0, 200).replace(/\s+\S*$/, '') + '…' : oneLiner
      }
      return ''
    }

    const mdSections = visibleEntries.map((entry) => {
      const date = dayjs(entry.sortDate).isValid() ? dayjs(entry.sortDate).format('YYYY-MM-DD') : ''
      const labels = (entry.labels ?? []).join(', ')
      const meta = [date, labels, `[supabase.com/changelog/${entry.slug}](https://supabase.com/changelog/${entry.slug})`]
        .filter(Boolean)
        .join(' · ')
      const summary = extractSummary(entry.body)
      return [`## ${entry.title}`, meta, summary].filter(Boolean).join('\n\n')
    })
    const changelogMd = `# Supabase Changelog\n\n${mdSections.join('\n\n---\n\n')}\n`
    const changelogMdPath = path.join(__dirname, '../public/changelog.md')
    await fs.writeFile(changelogMdPath, changelogMd, 'utf8')
    console.log(`✅ Generated changelog.md (${visibleEntries.length} entries)`)

    // One markdown file per entry → /changelog/<number>.md (same content shape as the web page body).
    const changelogEntryMdDir = path.join(__dirname, '../public/changelog')
    await fs.mkdir(changelogEntryMdDir, { recursive: true })
    for (const entry of visibleEntries) {
      const published = dayjs(entry.sortDate).isValid()
        ? dayjs(entry.sortDate).format('YYYY-MM-DD')
        : ''
      const titleLine = String(entry.title ?? '')
        .replace(/\n/g, ' ')
        .trim()
      const labelsYaml = (entry.labels ?? []).map((l) => `  - ${l}`).join('\n')
      const pageUrl = `https://supabase.com/changelog/${entry.slug}`
      const entryMd = `---
number: ${entry.number}
slug: ${entry.slug}
published: ${published}
discussion: ${entry.url}
labels:
${labelsYaml || '  []'}
page: ${pageUrl}
---

# ${titleLine}

${entry.body ?? ''}
`
      await fs.writeFile(
        path.join(changelogEntryMdDir, `${entry.slug}.md`),
        entryMd.trim() + '\n',
        'utf8'
      )
    }
    console.log(`✅ Generated changelog/*.md (${visibleEntries.length} files)`)
  }
} catch (error) {
  console.warn('Error generating changelog RSS:', error)
}
