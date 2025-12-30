import { config } from 'dotenv'
import { existsSync, rmSync, mkdirSync, renameSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'

const envLocalPath = path.resolve(process.cwd(), '.env.local')
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath })
}

const repo = process.env.INTERNAL_CONTENT_REPO
const token = process.env.INTERNAL_CONTENT_GITHUB_TOKEN
const branch = process.env.INTERNAL_CONTENT_BRANCH || 'main'

const targetDir = path.resolve(process.cwd(), 'content/internal')
const tmpDir = path.resolve(process.cwd(), '.tmp-internal-content')

if (!token) {
  console.log('INTERNAL_CONTENT_GITHUB_TOKEN not set; skipping internal content sync.')
  process.exit(0)
}

if (!repo) {
  console.error('INTERNAL_CONTENT_REPO not set; cannot sync internal content.')
  process.exit(1)
}

const repoUrl = `https://${token}@github.com/${repo}.git`
const run = (cmd: string) => execSync(cmd, { stdio: 'inherit' })

try {
  // Clean up any existing content
  rmSync(targetDir, { recursive: true, force: true })
  rmSync(tmpDir, { recursive: true, force: true })

  // Clone to temp directory
  run(`git clone --depth 1 --branch ${branch} ${repoUrl} ${tmpDir}`)

  // Remove git folder so targetDir is not a git repo
  rmSync(path.join(tmpDir, '.git'), { recursive: true, force: true })

  // Ensure parent directory exists
  mkdirSync(path.dirname(targetDir), { recursive: true })

  // Move temp folder into place (Node, not shell)
  renameSync(tmpDir, targetDir)

  console.log('Internal content synced successfully')
} catch (e: any) {
  console.error('Failed to sync internal content:', e?.message ?? e)
  rmSync(tmpDir, { recursive: true, force: true })
  process.exit(1)
}
