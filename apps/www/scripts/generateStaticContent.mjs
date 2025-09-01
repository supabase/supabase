import { promises as fs } from 'fs'
import fsSync from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'

// Constants
const FILENAME_SUBSTRING = 11 // based on YYYY-MM-DD format
const CMS_SITE_ORIGIN =
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
    ? 'https://supabase.com'
    : process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL &&
        typeof process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL === 'string'
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL?.replace('zone-www-dot-com-git-', 'cms-git-')}`
      : 'http://localhost:3030'
const PAYLOAD_API_KEY = process.env.PAYLOAD_API_KEY || process.env.CMS_READ_KEY

// Debug logging for environment variables
console.log(`[DEBUG] Environment variables:`, {
  NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
  NEXT_PUBLIC_VERCEL_BRANCH_URL: process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL,
  CMS_SITE_ORIGIN: CMS_SITE_ORIGIN,
  CMS_URL: process.env.CMS_URL,
  PAYLOAD_API_KEY_present: !!process.env.PAYLOAD_API_KEY,
  CMS_READ_KEY_present: !!process.env.CMS_READ_KEY,
})
console.log(`[DEBUG] Resolved CMS_SITE_ORIGIN: ${CMS_SITE_ORIGIN}`)

/**
 * Fixes Safari dates sorting bug
 */
const sortDates = (a, b, direction = 'desc') => {
  // Handle posts with missing dates - they should be sorted to the end
  if (!a.date && !b.date) {
    console.log(`[DEBUG] sortDates: Both missing dates - a.date: ${a.date}, b.date: ${b.date}`)
    return 0 // Both missing dates, keep current order
  }
  if (!a.date) {
    console.log(`[DEBUG] sortDates: A missing date - a.date: ${a.date}, b.date: ${b.date}`)
    return 1 // A has no date, put it after B
  }
  if (!b.date) {
    console.log(`[DEBUG] sortDates: B missing date - a.date: ${a.date}, b.date: ${b.date}`)
    return -1 // B has no date, put it after A
  }

  const isAsc = direction === 'asc'
  var reg = /-|:|T|\+/ //The regex on which matches the string should be split (any used delimiter) -> could also be written like /[.:T\+]/

  // Handle different date formats more robustly
  const parseDate = (dateString) => {
    // If it's already a Date object, use it
    if (dateString instanceof Date) {
      return dateString
    }

    // Try to parse as ISO string first (for CMS dates)
    const isoDate = new Date(dateString)
    if (!isNaN(isoDate.getTime())) {
      return isoDate
    }

    // Fallback to original Safari workaround parsing
    var parsed = dateString.split(reg)

    // Month needs to be 0-indexed for JavaScript Date constructor
    const year = parseInt(parsed[0])
    const month = parseInt(parsed[1]) - 1 // JavaScript months are 0-indexed
    const day = parseInt(parsed[2])

    const fallbackDate = new Date(year, month, day)
    return fallbackDate
  }

  var dates = [parseDate(a.date), parseDate(b.date)]
  const result = isAsc ? dates[0] - dates[1] : dates[1] - dates[0]

  return result
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
 * Get CMS blog posts
 */
const getCMSBlogPosts = async () => {
  console.log(`[DEBUG] getCMSBlogPosts: Starting fetch from ${CMS_SITE_ORIGIN}`)
  console.log(`[DEBUG] getCMSBlogPosts: PAYLOAD_API_KEY present: ${!!PAYLOAD_API_KEY}`)

  try {
    const url = `${CMS_SITE_ORIGIN}/api/posts?depth=2&draft=false&where[_status][equals]=published`
    console.log(`[DEBUG] getCMSBlogPosts: Fetching URL: ${url}`)

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(PAYLOAD_API_KEY && { Authorization: `Bearer ${PAYLOAD_API_KEY}` }),
      },
    })

    console.log(`[DEBUG] getCMSBlogPosts: Response status: ${response.status}`)
    console.log(
      `[DEBUG] getCMSBlogPosts: Response headers:`,
      Object.fromEntries(response.headers.entries())
    )

    if (!response.ok) {
      const responseText = await response.text()
      console.error(
        `[DEBUG] getCMSBlogPosts: HTTP error! status: ${response.status}, body: ${responseText.slice(0, 500)}`
      )
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.toLowerCase().includes('application/json')) {
      const body = await response.text()
      console.warn(
        `[getCMSBlogPosts] Non-JSON response from ${CMS_SITE_ORIGIN}/api/posts (content-type: '${contentType}'). Returning empty posts. Body (truncated): ${body.slice(0, 200)}`
      )
      return []
    }

    const data = await response.json()
    console.log(`[DEBUG] getCMSBlogPosts: Raw response data:`, {
      totalDocs: data.totalDocs,
      docsCount: data.docs?.length,
      hasNextPage: data.hasNextPage,
      page: data.page,
    })

    if (data.docs && data.docs.length > 0) {
      console.log(
        `[DEBUG] getCMSBlogPosts: First few posts:`,
        data.docs.slice(0, 3).map((post) => ({
          slug: post.slug,
          title: post.title,
          _status: post._status,
          date: post.date,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        }))
      )

      // Log details about posts with and without dates
      const postsWithDates = data.docs.filter((post) => post.date)
      const postsWithoutDates = data.docs.filter((post) => !post.date)

      console.log(`[DEBUG] getCMSBlogPosts: Posts with dates: ${postsWithDates.length}`)
      if (postsWithDates.length > 0) {
        console.log(
          `[DEBUG] getCMSBlogPosts: Posts with dates:`,
          postsWithDates.map((p) => ({
            slug: p.slug,
            date: p.date,
          }))
        )
      }

      console.log(`[DEBUG] getCMSBlogPosts: Posts without dates: ${postsWithoutDates.length}`)
      if (postsWithoutDates.length > 0) {
        console.log(
          `[DEBUG] getCMSBlogPosts: Posts without dates:`,
          postsWithoutDates.map((p) => ({
            slug: p.slug,
            title: p.title,
          }))
        )
      }
    }

    const posts = data.docs
      .filter((post) => post.slug && post.title && post.description)
      .map((post) => {
        const options = { month: 'long', day: 'numeric', year: 'numeric' }
        const formattedDate = new Date(post.date || new Date()).toLocaleDateString('en-IN', options)

        return {
          slug: post.slug,
          title: post.title,
          description: post.description,
          date: post.date || null, // Keep null if no date instead of using current time
          formattedDate,
          url: `/blog/${post.slug}`,
          isCMS: true,
          ...post,
        }
      })

    console.log(`[DEBUG] getCMSBlogPosts: Filtered posts count: ${posts.length}`)
    console.log(
      `[DEBUG] getCMSBlogPosts: Filtered post slugs:`,
      posts.map((p) => p.slug)
    )

    return posts
  } catch (error) {
    console.error('[DEBUG] getCMSBlogPosts: Error fetching CMS blog posts:', error)
    return []
  }
}

/**
 * Get latest blog posts from both sources
 */
const getLatestBlogPosts = async () => {
  console.log(`[DEBUG] getLatestBlogPosts: Starting to fetch posts from both sources`)

  const staticPosts = getStaticBlogPosts()
  console.log(`[DEBUG] getLatestBlogPosts: Found ${staticPosts.length} static posts`)
  console.log(
    `[DEBUG] getLatestBlogPosts: Static post slugs:`,
    staticPosts.map((p) => p.slug)
  )

  const cmsPosts = await getCMSBlogPosts()
  console.log(`[DEBUG] getLatestBlogPosts: Found ${cmsPosts.length} CMS posts`)
  console.log(
    `[DEBUG] getLatestBlogPosts: CMS post slugs:`,
    cmsPosts.map((p) => p.slug)
  )

  // Combine and sort all posts by date
  const allPosts = [...staticPosts, ...cmsPosts]
  console.log(`[DEBUG] getLatestBlogPosts: Combined total posts: ${allPosts.length}`)

  // Filter out posts without valid dates and sort
  const validPosts = allPosts.sort((a, b) => sortDates(a, b, 'desc'))
  console.log(`[DEBUG] getLatestBlogPosts: Valid posts after filtering: ${validPosts.length}`)

  // Return latest 10 posts
  const latestPosts = validPosts
    .slice(0, 10)
    .map(({ title, url, description, date, formattedDate }) => ({
      title,
      url,
      description,
      date,
      formattedDate,
    }))

  console.log(`[DEBUG] getLatestBlogPosts: Final latest posts count: ${latestPosts.length}`)
  console.log(
    `[DEBUG] getLatestBlogPosts: Final latest post URLs:`,
    latestPosts.map((p) => p.url)
  )

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

console.log(`✅ Generated static content with ${latestBlogPosts.length} blog posts`)
console.log(
  `[DEBUG] Final output - latestBlogPosts slugs:`,
  latestBlogPosts.map((p) => p.url.replace('/blog/', ''))
)
