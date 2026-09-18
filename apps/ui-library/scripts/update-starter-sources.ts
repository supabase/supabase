import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import {
  starterSources,
  type StarterSource,
  type StarterSourceSnapshot,
} from '../config/starter-sources'

const libraryDirectory = fileURLToPath(new URL('../', import.meta.url))
const repositoryDirectory = path.resolve(libraryDirectory, '../..')
const outputDirectory = path.join(libraryDirectory, 'registry/starter-sources')

export function includeStarterSourceFile(file: string, framework: StarterSource['framework']) {
  if (/^supabase\/(?:migrations|schemas)\/.+\.sql$/.test(file)) return true
  if (file === 'supabase/config.toml') return true
  if (/^supabase\/functions\/.+\.(?:[cm]?[jt]sx?|json|toml)$/.test(file)) return true
  return framework === 'flutter'
    ? /^lib\/pages\/.+\.dart$/.test(file)
    : /^(?:src\/)?app\/(?:.*\/)?(?:page|route)\.[cm]?[jt]sx?$/.test(file) ||
        /^(?:src\/)?pages\/.+\.[cm]?[jt]sx?$/.test(file)
}

export function needsStarterSourceContent(file: string) {
  return file.endsWith('.sql') || file === 'supabase/config.toml'
}

export function createStarterSnapshot(
  descriptor: StarterSource,
  revision: string,
  files: StarterSourceSnapshot['files']
): StarterSourceSnapshot {
  if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error(`Invalid revision for ${descriptor.name}`)
  const selected = files
    .filter((file) => includeStarterSourceFile(file.path, descriptor.framework))
    .map(({ path, content }) => {
      if (needsStarterSourceContent(path)) {
        if (content === undefined)
          throw new Error(`${descriptor.name}: missing content for ${path}`)
        return { path, content }
      }
      return { path }
    })
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
  if (!selected.length) throw new Error(`No architecture source files found for ${descriptor.name}`)

  return {
    name: descriptor.name,
    framework: descriptor.framework,
    source: {
      repository: descriptor.repository,
      root: descriptor.root,
      revision,
      treeUrl: `https://github.com/${descriptor.repository}/tree/${revision}${descriptor.root ? `/${descriptor.root}` : ''}`,
    },
    files: selected,
  }
}

async function githubJson(endpoint: string) {
  const response = await fetch(`https://api.github.com/repos/${endpoint}`, {
    headers: { Accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) throw new Error(`GitHub ${response.status}: ${endpoint}`)
  return response.json()
}

async function readGithubSource(descriptor: StarterSource): Promise<StarterSourceSnapshot> {
  const commit = await githubJson(`${descriptor.repository}/commits/HEAD`)
  if (!/^[a-f0-9]{40}$/.test(commit.sha) || !commit.commit?.tree?.sha) {
    throw new Error(`GitHub returned an invalid commit for ${descriptor.repository}`)
  }
  const tree = await githubJson(
    `${descriptor.repository}/git/trees/${commit.commit.tree.sha}?recursive=1`
  )
  if (tree.truncated || !Array.isArray(tree.tree)) {
    throw new Error(`GitHub returned an incomplete source tree for ${descriptor.repository}`)
  }
  const rootPrefix = descriptor.root ? `${descriptor.root}/` : ''
  const entries = tree.tree.filter(
    (entry: { type: string; path: string }) =>
      entry.type === 'blob' &&
      entry.path.startsWith(rootPrefix) &&
      includeStarterSourceFile(entry.path.slice(rootPrefix.length), descriptor.framework)
  ) as { path: string; sha: string }[]
  const files = await Promise.all(
    entries.map(async (entry) => {
      const filePath = entry.path.slice(rootPrefix.length)
      if (!needsStarterSourceContent(filePath)) return { path: filePath }
      const blob = await githubJson(`${descriptor.repository}/git/blobs/${entry.sha}`)
      if (blob.encoding !== 'base64' || typeof blob.content !== 'string') {
        throw new Error(`GitHub returned invalid source content for ${entry.path}`)
      }
      return { path: filePath, content: Buffer.from(blob.content, 'base64').toString('utf8') }
    })
  )
  return createStarterSnapshot(descriptor, commit.sha, files)
}

function readLocalSource(descriptor: StarterSource): StarterSourceSnapshot {
  const git = (...args: string[]) =>
    execFileSync('git', args, { cwd: repositoryDirectory, encoding: 'utf8' })
  // Use the last source change, so unrelated library commits do not churn the snapshot.
  const revision = git('log', '-1', '--format=%H', 'HEAD', '--', descriptor.root).trim()
  const prefix = `${descriptor.root}/`
  const files = git('ls-tree', '-r', '--name-only', revision, '--', descriptor.root)
    .trim()
    .split('\n')
    .map((file) => file.slice(prefix.length))
    .filter((file) => includeStarterSourceFile(file, descriptor.framework))
    .map((file) => ({
      path: file,
      ...(needsStarterSourceContent(file)
        ? { content: git('show', `${revision}:${prefix}${file}`) }
        : {}),
    }))
  return createStarterSnapshot(descriptor, revision, files)
}

async function updateStarterSources(names: string[]) {
  for (const name of names) {
    if (!starterSources.some((source) => source.name === name)) {
      throw new Error(`Unknown starter source: ${name}`)
    }
  }
  const descriptors = starterSources.filter(
    (source) => !names.length || names.includes(source.name)
  )
  const snapshots = await Promise.all(
    descriptors.map((source) =>
      source.repository === 'supabase/supabase' ? readLocalSource(source) : readGithubSource(source)
    )
  )
  await mkdir(outputDirectory, { recursive: true })
  for (const snapshot of snapshots) {
    await writeFile(
      path.join(outputDirectory, `${snapshot.name}.json`),
      `${JSON.stringify(snapshot, null, 2)}\n`
    )
    console.log(`Updated ${snapshot.name} from ${snapshot.source.revision}`)
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  updateStarterSources(process.argv.slice(2)).catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
