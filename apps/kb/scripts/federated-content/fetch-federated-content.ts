// Fetches every troubleshooting article from the private supabase/troubleshooting
// repo's `guides` folder into src/content/troubleshooting/ (gitignored,
// regenerated on every prebuild — see content.config.ts's `troubleshooting`
// collection). No content processing: body text is written as fetched.
import crypto from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from '@octokit/core'
import { retry } from '@octokit/plugin-retry'
import matter from 'gray-matter'

const SOURCE = { org: 'supabase', repo: 'troubleshooting', branch: 'main', dir: 'guides' }

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const TROUBLESHOOTING_DIRECTORY = join(SCRIPT_DIR, '../../src/content/troubleshooting')

/**
 * Prefers the docs GitHub App (must also be granted access to the private
 * supabase/troubleshooting repo). Falls back to `GH_TOKEN` / `GITHUB_TOKEN`
 * for local runs. A partially configured App is an error rather than a
 * token fall-back, to avoid silently authenticating as the wrong identity.
 */
function githubAuthOptions() {
  const appId = process.env.DOCS_GITHUB_APP_ID
  const installationId = process.env.DOCS_GITHUB_APP_INSTALLATION_ID
  const privateKey = process.env.DOCS_GITHUB_APP_PRIVATE_KEY

  if (appId && installationId && privateKey) {
    return {
      authStrategy: createAppAuth,
      auth: {
        appId,
        installationId,
        privateKey: crypto
          .createPrivateKey(privateKey)
          .export({ type: 'pkcs8', format: 'pem' })
          .toString(),
      },
    }
  }

  const appVars: Array<[string, string | undefined]> = [
    ['DOCS_GITHUB_APP_ID', appId],
    ['DOCS_GITHUB_APP_INSTALLATION_ID', installationId],
    ['DOCS_GITHUB_APP_PRIVATE_KEY', privateKey],
  ]
  const missing = appVars.filter(([, value]) => !value).map(([name]) => name)
  if (missing.length < appVars.length) {
    throw new Error(`Incomplete GitHub App configuration: ${missing.join(', ')} not set.`)
  }

  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN
  if (token) return { auth: token }

  throw new Error(
    'Missing GitHub credentials. Set DOCS_GITHUB_APP_ID/_INSTALLATION_ID/_PRIVATE_KEY, or GH_TOKEN / GITHUB_TOKEN.'
  )
}

const RetryOctokit = Octokit.plugin(retry)
let octokitInstance: InstanceType<typeof RetryOctokit>

function octokit() {
  if (!octokitInstance) octokitInstance = new RetryOctokit(githubAuthOptions())
  return octokitInstance
}

async function listMarkdownFiles(path: string): Promise<string[]> {
  const response = await octokit().request('GET /repos/{owner}/{repo}/contents/{path}', {
    owner: SOURCE.org,
    repo: SOURCE.repo,
    path,
    ref: SOURCE.branch,
  })
  if (!Array.isArray(response.data))
    throw new Error(`${path} in ${SOURCE.org}/${SOURCE.repo} is not a directory`)
  return response.data
    .filter((entry) => entry.type === 'file' && /\.mdx?$/.test(entry.name))
    .map((entry) => entry.name)
}

async function getFileContents(path: string): Promise<string> {
  const response = await octokit().request('GET /repos/{owner}/{repo}/contents/{path}', {
    owner: SOURCE.org,
    repo: SOURCE.repo,
    path,
    ref: SOURCE.branch,
  })
  if (
    Array.isArray(response.data) ||
    !('content' in response.data) ||
    response.data.type !== 'file'
  ) {
    throw new Error(`Unexpected response for ${path} in ${SOURCE.org}/${SOURCE.repo}`)
  }
  return Buffer.from(response.data.content, 'base64').toString('utf-8')
}

// Local slug: strip the extension and the random hex suffix some filenames
// carry (e.g. `foo-bar-94a76b.mdx` -> `foo-bar`).
function slugFromFilename(filename: string): string {
  return filename.replace(/\.mdx?$/, '').replace(/-[0-9a-f]{6}$/i, '')
}

// Most source files use TOML frontmatter (`title = "..."`), which gray-matter
// can't parse (it assumes YAML) — it either throws or silently returns
// garbage. Detected here by gray-matter failing to produce a `title` string,
// and skipped entirely rather than guessed at.
function parseGuide(raw: string): { title: string; topics: string[]; body: string } | null {
  let data: Record<string, unknown>
  let body: string
  try {
    ;({ data, content: body } = matter(raw))
  } catch {
    return null
  }
  if (typeof data.title !== 'string') return null
  return { title: data.title, topics: Array.isArray(data.topics) ? data.topics : [], body }
}

async function fetchPage(filename: string): Promise<'fetched' | 'legacy-toml'> {
  const raw = await getFileContents(`${SOURCE.dir}/${filename}`)
  const guide = parseGuide(raw)
  if (!guide) return 'legacy-toml'

  const frontmatter = {
    title: guide.title,
    topics: guide.topics,
  }
  const output = matter.stringify(guide.body, frontmatter)
  await writeFile(join(TROUBLESHOOTING_DIRECTORY, `${slugFromFilename(filename)}.md`), output)
  return 'fetched'
}

async function fetchFederatedContent() {
  await mkdir(TROUBLESHOOTING_DIRECTORY, { recursive: true })

  const filenames = await listMarkdownFiles(SOURCE.dir)
  const results = await Promise.all(filenames.map((filename) => fetchPage(filename)))

  const legacyTomlFiles = filenames.filter((_, i) => results[i] === 'legacy-toml')
  if (legacyTomlFiles.length > 0) {
    console.warn(
      `[fetch-federated-content.ts]: ${legacyTomlFiles.length} troubleshooting guide(s) contained TOML frontmatter syntax and were ignored:`
    )
    for (const filename of legacyTomlFiles) console.warn(`  - ${filename}`)
  }

  const fetchedCount = filenames.length - legacyTomlFiles.length
  console.log(
    `Fetched ${fetchedCount}/${filenames.length} troubleshooting page(s) into src/content/troubleshooting/`
  )
}

fetchFederatedContent().catch((error) => {
  throw error
})
