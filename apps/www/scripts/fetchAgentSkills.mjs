// @ts-check

/**
 * Fetches the latest agent-skills index.json from supabase/agent-skills and
 * writes it to public/.well-known/agent-skills/index.json.
 *
 * Skill URLs in the published index.json are absolute GitHub Release asset
 * URLs — no rewriting needed on this side.
 *
 * Spec: https://github.com/agentskills/agentskills/pull/254
 * Uses AGENT_SKILLS_GITHUB_TOKEN if set to avoid GitHub's unauthenticated
 * rate limit (60 req/hr per IP, shared across Vercel build machines).
 *
 * If the fetch fails outside production, the committed index.json is kept so
 * preview and local builds don't break on GitHub rate limits.
 */

import { existsSync, promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public', '.well-known', 'agent-skills')
const REPO = 'supabase/agent-skills'

async function fetchJson(url) {
  const headers = { 'User-Agent': 'supabase-www-build' }
  if (process.env.AGENT_SKILLS_GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.AGENT_SKILLS_GITHUB_TOKEN}`
  }
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`)
  return res.json()
}

async function main() {
  const release = await fetchJson(`https://api.github.com/repos/${REPO}/releases/latest`)
  console.log(`Fetching agent-skills release: ${release.tag_name}`)

  const indexAsset = release.assets.find((a) => a.name === 'index.json')
  if (!indexAsset) throw new Error('No index.json found in release assets')

  const index = await fetchJson(indexAsset.browser_download_url)

  await fs.mkdir(OUT_DIR, { recursive: true })
  await fs.writeFile(join(OUT_DIR, 'index.json'), JSON.stringify(index, null, 2) + '\n')

  for (const skill of index.skills ?? []) {
    console.log(`  ${skill.name}`)
  }
  console.log(`Done — wrote public/.well-known/agent-skills/index.json`)
}

main().catch((err) => {
  console.error(err)
  const canFallBack = process.env.VERCEL_ENV !== 'production'
  const hasPreviousWrite = existsSync(join(OUT_DIR, 'index.json'))

  if (canFallBack && hasPreviousWrite) {
    console.warn('Done — keeping committed public/.well-known/agent-skills/index.json')
    process.exit(0)
  }
  process.exit(1)
})
