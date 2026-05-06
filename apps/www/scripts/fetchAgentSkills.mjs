// @ts-check

/**
 * Fetches the latest agent-skills release from supabase/agent-skills and writes
 * index.json + skill archives to public/.well-known/agent-skills/.
 *
 * Releases are semver-tagged (e.g. v0.2.0) and managed by Release Please in
 * https://github.com/supabase/agent-skills. Each release includes:
 *   - index.json  (discovery index per agent-skills .well-known spec v0.2.0)
 *   - *.tar.gz    (one archive per skill)
 *
 * Runs unauthenticated — public repo, build-time only.
 */

import { createHash } from 'node:crypto'
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

async function download(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'supabase-www-build' } })
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

function sha256(buf) {
  return 'sha256:' + createHash('sha256').update(buf).digest('hex')
}

async function main() {
  const release = await fetchJson(`https://api.github.com/repos/${REPO}/releases/latest`)
  console.log(`Fetching agent-skills release: ${release.tag_name}`)

  await fs.mkdir(OUT_DIR, { recursive: true })

  // Download all release assets (index.json + skill tarballs)
  const assetMap = Object.fromEntries(release.assets.map((a) => [a.name, a.browser_download_url]))
  for (const [name, url] of Object.entries(assetMap)) {
    const buf = await download(url)
    await fs.writeFile(join(OUT_DIR, name), buf)
    console.log(`  ${name}`)
  }

  // Verify digests for skill artifacts using index.json
  if (assetMap['index.json']) {
    const index = JSON.parse(await fs.readFile(join(OUT_DIR, 'index.json'), 'utf8'))
    for (const skill of index.skills ?? []) {
      const artifactName = skill.url.split('/').pop()
      const artifactPath = join(OUT_DIR, artifactName)
      const actual = sha256(await fs.readFile(artifactPath))
      if (actual !== skill.digest) {
        throw new Error(
          `Digest mismatch for ${skill.name}: expected ${skill.digest}, got ${actual}`
        )
      }
      console.log(`  ✓ ${skill.name} digest verified`)
    }
  }

  console.log(`Done — wrote to public/.well-known/agent-skills/`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
