// @ts-check

/**
 * Fetches the latest agent-skills release from supabase/agent-skills and writes
 * index.json + skill archives to public/.well-known/agent-skills/.
 *
 * Runs unauthenticated - public repo, build-time only.
 */

import { promises as fs } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public', '.well-known', 'agent-skills')
const REPO = 'supabase/agent-skills'

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'supabase-www-build' } })
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`)
  return res.json()
}

async function download(url, destPath) {
  const res = await fetch(url, { headers: { 'User-Agent': 'supabase-www-build' } })
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`)
  await fs.writeFile(destPath, Buffer.from(await res.arrayBuffer()))
}

async function main() {
  const release = await fetchJson(`https://api.github.com/repos/${REPO}/releases/latest`)
  console.log(`Fetching agent-skills release: ${release.tag_name}`)

  await fs.mkdir(OUT_DIR, { recursive: true })

  for (const asset of release.assets) {
    await download(asset.browser_download_url, join(OUT_DIR, asset.name))
    console.log(`  ${asset.name}`)
  }

  console.log(`Done - wrote to public/.well-known/agent-skills/`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
