import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Latest Blog Posts
import { allBlogPosts } from '../.contentlayer/generated/index.mjs'

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

const latestBlogPosts = allBlogPosts
  .sort(sortDates)
  .slice(0, 2)
  .map(({ title, url, description }) => ({ title, url, description }))

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
  throw error
}

// Careers Jobs count
const getCareerCount = async () => {
  const job_res = await fetch('https://api.ashbyhq.com/posting-api/job-board/supabase')
  const job_data = await job_res.json()

  return job_data.jobs.length
}

let careersCount = 0

try {
  careersCount = await getCareerCount()
} catch (error) {
  throw error
}

// Create folder for static content
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const folderPath = path.join(__dirname, '../.contentlayer/generated/staticContent')
try {
  await fs.mkdir(folderPath, { recursive: true })
} catch (error) {
  if (error.code !== 'EEXIST') {
    throw error
  }
  // Folder already exists, continue silently
}

// Write static content to file
const filePath = path.join(__dirname, '../.contentlayer/generated/staticContent/_index.json')
await fs.writeFile(
  filePath,
  JSON.stringify({ latestBlogPosts: latestBlogPosts, jobsCount: careersCount, githubStars: stars }),
  'utf8'
)
