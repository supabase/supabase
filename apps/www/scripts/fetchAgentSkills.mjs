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
import { dirname, join } from 'node:path'
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

  // Find the index.json asset in the GitHub release to get its download URL
  const githubReleaseIndexAsset = release.assets.find((a) => a.name === 'index.json')
  if (!githubReleaseIndexAsset) throw new Error('No index.json found in release assets')

  // Keep the GitHub download URL as the base URI for RFC 3986 artifact URL resolution (see below)
  const githubReleaseIndexUrl = githubReleaseIndexAsset.browser_download_url
  const indexJsonFileBuf = await download(githubReleaseIndexUrl)
  const indexJsonFile = JSON.parse(indexJsonFileBuf.toString('utf8'))

  // Fetch each artifact from its resolved URL, verify digest, buffer before writing
  const buffers = { 'index.json': indexJsonFileBuf }
  for (const skill of indexJsonFile.skills ?? []) {
    // Resolve skill.url against the index URL per RFC 3986 §5.2.2 (https://datatracker.ietf.org/doc/html/rfc3986#section-5.2.2)
    // as adopted by the agent-skills .well-known spec (https://github.com/agentskills/agentskills/pull/254)
    // skill.url can be relative ("supabase.tar.gz"), path-absolute, or fully absolute (e.g. a CDN URL)
    const githubReleaseArtifactUrl = new URL(skill.url, githubReleaseIndexUrl).href
    const artifactName = new URL(githubReleaseArtifactUrl).pathname.split('/').pop()
    const buf = await download(githubReleaseArtifactUrl)
    const actual = sha256(buf)
    if (actual !== skill.digest) {
      throw new Error(`Digest mismatch for ${skill.name}: expected ${skill.digest}, got ${actual}`)
    }
    console.log(`  ✓ ${skill.name} digest verified`)
    buffers[artifactName] = buf
  }

  await fs.mkdir(OUT_DIR, { recursive: true })

  for (const [name, buf] of Object.entries(buffers)) {
    await fs.writeFile(join(OUT_DIR, name), buf)
  }

  console.log(`Done — wrote to public/.well-known/agent-skills/`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
