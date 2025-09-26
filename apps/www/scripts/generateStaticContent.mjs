import { promises as fs } from 'fs'
import fsSync from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'

// Constants
const FILENAME_SUBSTRING = 11 // based on YYYY-MM-DD format
const CMS_SITE_ORIGIN =
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
    ? 'https://cms.supabase.com'
    : process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL &&
        typeof process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL === 'string'
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL?.replace('zone-www-dot-com-git-', 'cms-git-')}`
      : 'http://localhost:3030'
const CMS_API_KEY = process.env.CMS_API_KEY

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
  try {
    const url = `${CMS_SITE_ORIGIN}/api/posts?depth=2&draft=false&where[_status][equals]=published`

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(CMS_API_KEY && { Authorization: `Bearer ${CMS_API_KEY}` }),
      },
    })

    if (!response.ok) {
      const responseText = await response.text()

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

    return posts
  } catch (_error) {
    // don't console error to avoid noise if env vars not set
    return []
  }
}

/**
 * Get latest blog posts from both sources
 */
const getLatestBlogPosts = async () => {
  const staticPosts = getStaticBlogPosts()

  const cmsPosts = await getCMSBlogPosts()

  // Combine and sort all posts by date
  const allPosts = [...staticPosts, ...cmsPosts]

  // Filter out posts without valid dates and sort
  const validPosts = allPosts.sort((a, b) => sortDates(a, b, 'desc'))

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
