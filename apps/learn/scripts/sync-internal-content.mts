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
const safeRepo = `https://github.com/${repo}.git`

// Run command with output captured to prevent token leakage
const run = (cmd: string) => {
  try {
    const output = execSync(cmd, { stdio: 'pipe', encoding: 'utf-8' })
    return output
  } catch (error: any) {
    // Sanitize error messages by replacing token with [REDACTED]
    const sanitizedMessage = error.message?.replace(new RegExp(token, 'g'), '[REDACTED]') ?? 'Unknown error'
    const sanitizedStderr = error.stderr?.toString().replace(new RegExp(token, 'g'), '[REDACTED]') ?? ''
    const sanitizedStdout = error.stdout?.toString().replace(new RegExp(token, 'g'), '[REDACTED]') ?? ''

    const sanitizedError = new Error(sanitizedMessage)
    ;(sanitizedError as any).stderr = sanitizedStderr
    ;(sanitizedError as any).stdout = sanitizedStdout
    ;(sanitizedError as any).status = error.status
    throw sanitizedError
  }
}

try {
  // Clean up any existing content
  rmSync(targetDir, { recursive: true, force: true })
  rmSync(tmpDir, { recursive: true, force: true })

  // Clone to temp directory (using token URL but errors will be sanitized)
  console.log(`Cloning ${safeRepo} branch ${branch}...`)
  run(`git clone --depth 1 --branch ${branch} ${repoUrl} ${tmpDir}`)

  // Remove git folder so targetDir is not a git repo
  rmSync(path.join(tmpDir, '.git'), { recursive: true, force: true })

  // Ensure parent directory exists
  mkdirSync(path.dirname(targetDir), { recursive: true })

  // Move temp folder into place (Node, not shell)
  renameSync(tmpDir, targetDir)

  console.log('Internal content synced successfully')
} catch (e: any) {
  // Sanitize error message to prevent token leakage
  const sanitizedMessage = (e?.message ?? String(e)).replace(new RegExp(token, 'g'), '[REDACTED]')
  console.error('Failed to sync internal content:', sanitizedMessage)
  if (e?.stderr) {
    console.error('Error details:', e.stderr)
  }
  rmSync(tmpDir, { recursive: true, force: true })
  process.exit(1)
}
