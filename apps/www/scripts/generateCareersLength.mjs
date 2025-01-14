import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

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

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const folderPath = path.join(__dirname, '../.contentlayer/generated/CareersCount')
try {
  await fs.mkdir(folderPath, { recursive: true })
} catch (error) {
  if (error.code !== 'EEXIST') {
    throw error
  }
  // Folder already exists, continue silently
}

const filePath = path.join(__dirname, '../.contentlayer/generated/CareersCount/_index.json')
await fs.writeFile(filePath, JSON.stringify({ jobsCount: careersCount }), 'utf8')
