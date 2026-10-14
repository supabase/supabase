import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { createServiceRoleClient } from '../lib/supabase/service-role'

const execFileAsync = promisify(execFile)

const COMMUNITY_ORG = 'supabase-community'
const maxBuffer = 1024 * 1024 * 50

type RepoListItem = {
  name: string
  url: string
  description?: string | null
  isArchived?: boolean
}

type RepoDetails = {
  archived?: boolean
  default_branch: string
  description?: string | null
  forks_count?: number
  html_url: string
  is_template?: boolean
  language?: string | null
  license?: { spdx_id?: string | null } | null
  name: string
  open_issues_count?: number
  stargazers_count?: number
  subscribers_count?: number
  topics?: string[]
  watchers_count?: number
}

type CommitListItem = {
  commit?: { author?: { date?: string } | null; committer?: { date?: string } | null }
}

type ReleaseDetails = {
  published_at?: string | null
}

type CommunityProfile = {
  files?: {
    code_of_conduct?: unknown
    license?: unknown
    readme?: { url?: string | null } | null
  } | null
}

type TreeItem = {
  path?: string
  type?: string
}

type TreeResponse = {
  tree?: TreeItem[]
}

type ContentResponse = {
  content?: string
  encoding?: string
  size?: number
}

async function gh<T>(args: string[]): Promise<T> {
  const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN
  const env = token ? { ...process.env, GH_TOKEN: token } : process.env
  const { stdout } = await execFileAsync('gh', args, { env, maxBuffer })

  return JSON.parse(stdout) as T
}

async function maybeGh<T>(args: string[]): Promise<T | undefined> {
  try {
    return await gh<T>(args)
  } catch (error) {
    if (error instanceof Error && !/HTTP 404/.test(error.message)) {
      console.warn(`  ! gh ${args.join(' ')} failed: ${error.message.split('\n')[0]}`)
    }
    return undefined
  }
}

async function listRepos(): Promise<RepoListItem[]> {
  return gh<RepoListItem[]>([
    'repo',
    'list',
    COMMUNITY_ORG,
    '--visibility=public',
    '--limit=1000',
    '--json',
    'name,url,description,isArchived',
  ])
}

function toIsoOrNull(value: string | null | undefined): string | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function daysBetween(fromIso: string | null, toDate: Date): number | null {
  if (!fromIso) return null
  const from = new Date(fromIso).getTime()
  if (Number.isNaN(from)) return null
  return (toDate.getTime() - from) / (1000 * 60 * 60 * 24)
}

function meanOf(...bools: boolean[]): number {
  if (bools.length === 0) return 0
  return bools.filter(Boolean).length / bools.length
}

function computeScore(input: {
  archived: boolean
  daysSinceLastCommit: number | null
  stars: number
  hasDocsFolder: boolean
  hasExamples: boolean
  readmeLength: number
  licenseSpdx: string | null
  hasCi: boolean
  hasCodeOfConduct: boolean
  openIssues: number
}): number {
  const freshness = input.archived
    ? 0
    : input.daysSinceLastCommit === null
      ? 0
      : Math.exp(-input.daysSinceLastCommit / 180)
  const popularity = Math.min(1, Math.log10(input.stars + 1) / 3)
  const content = meanOf(
    input.hasDocsFolder,
    input.hasExamples,
    input.readmeLength >= 500,
    input.licenseSpdx !== null
  )
  const health = meanOf(input.hasCi, input.hasCodeOfConduct, input.openIssues < 50)
  const raw = 25 * freshness + 25 * popularity + 25 * content + 25 * health
  return Math.max(0, Math.min(100, Math.round(raw)))
}

type RepoSnapshot = {
  owner: string
  name: string
  sync_run_id: string
  stars: number
  forks: number
  watchers: number
  open_issues: number
  last_commit_at: string | null
  last_release_at: string | null
  default_branch: string | null
  license_spdx: string | null
  readme_length: number
  has_docs_folder: boolean
  has_examples: boolean
  has_ci: boolean
  has_code_of_conduct: boolean
  computed_quality_score: number
}

type RepoRegistry = {
  owner: string
  name: string
  org: string
  html_url: string
  is_archived: boolean
  is_template: boolean
  last_synced_at: string
}

async function collectForRepo(
  repoName: string,
  runId: string,
  now: Date
): Promise<{ registry: RepoRegistry; snapshot: RepoSnapshot } | null> {
  const details = await maybeGh<RepoDetails>(['api', `repos/${COMMUNITY_ORG}/${repoName}`])
  if (!details) return null

  const branch = details.default_branch
  const [commits, release, profile, tree] = await Promise.all([
    maybeGh<CommitListItem[]>(['api', `repos/${COMMUNITY_ORG}/${repoName}/commits?per_page=1`]),
    maybeGh<ReleaseDetails>(['api', `repos/${COMMUNITY_ORG}/${repoName}/releases/latest`]),
    maybeGh<CommunityProfile>(['api', `repos/${COMMUNITY_ORG}/${repoName}/community/profile`]),
    branch
      ? maybeGh<TreeResponse>([
          'api',
          `repos/${COMMUNITY_ORG}/${repoName}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
        ])
      : Promise.resolve(undefined),
  ])

  const lastCommitAt = toIsoOrNull(
    commits?.[0]?.commit?.committer?.date ?? commits?.[0]?.commit?.author?.date ?? null
  )
  const lastReleaseAt = toIsoOrNull(release?.published_at)
  const licenseSpdx =
    details.license?.spdx_id && details.license.spdx_id !== 'NOASSERTION'
      ? details.license.spdx_id
      : null

  const treePaths = (tree?.tree ?? [])
    .filter((item) => item.type === 'tree' || item.type === 'blob')
    .map((item) => item.path ?? '')

  const hasDocsFolder = treePaths.some(
    (p) => p === 'docs' || p.startsWith('docs/') || p === 'doc' || p.startsWith('doc/')
  )
  const hasExamples = treePaths.some(
    (p) =>
      p === 'examples' || p.startsWith('examples/') || p === 'example' || p.startsWith('example/')
  )
  const hasCi = treePaths.some((p) => p.startsWith('.github/workflows/'))
  const hasCodeOfConduct = Boolean(profile?.files?.code_of_conduct)

  let readmeLength = 0
  const readme = await maybeGh<ContentResponse>([
    'api',
    `repos/${COMMUNITY_ORG}/${repoName}/readme`,
  ])
  if (readme?.content && readme.encoding === 'base64') {
    readmeLength = Buffer.from(readme.content.replace(/\s/g, ''), 'base64').byteLength
  } else if (readme?.size) {
    readmeLength = readme.size
  }

  const archived = Boolean(details.archived)
  const stars = details.stargazers_count ?? 0
  const openIssues = details.open_issues_count ?? 0
  const daysSinceLastCommit = daysBetween(lastCommitAt, now)

  const score = computeScore({
    archived,
    daysSinceLastCommit,
    stars,
    hasDocsFolder,
    hasExamples,
    readmeLength,
    licenseSpdx,
    hasCi,
    hasCodeOfConduct,
    openIssues,
  })

  return {
    registry: {
      owner: COMMUNITY_ORG,
      name: repoName,
      org: COMMUNITY_ORG,
      html_url: details.html_url,
      is_archived: archived,
      is_template: Boolean(details.is_template),
      last_synced_at: now.toISOString(),
    },
    snapshot: {
      owner: COMMUNITY_ORG,
      name: repoName,
      sync_run_id: runId,
      stars,
      forks: details.forks_count ?? 0,
      watchers: details.subscribers_count ?? details.watchers_count ?? 0,
      open_issues: openIssues,
      last_commit_at: lastCommitAt,
      last_release_at: lastReleaseAt,
      default_branch: details.default_branch ?? null,
      license_spdx: licenseSpdx,
      readme_length: readmeLength,
      has_docs_folder: hasDocsFolder,
      has_examples: hasExamples,
      has_ci: hasCi,
      has_code_of_conduct: hasCodeOfConduct,
      computed_quality_score: score,
    },
  }
}

async function main() {
  // Fail fast on missing env or gh not installed.
  await execFileAsync('gh', ['--version'], { maxBuffer })
  const supabase = createServiceRoleClient()

  const startedAt = new Date()
  const runInsert = await supabase
    .from('community_sync_runs')
    .insert({ started_at: startedAt.toISOString() })
    .select('id')
    .single()
  if (runInsert.error || !runInsert.data) {
    throw new Error(`Failed to create sync run: ${runInsert.error?.message ?? 'no data'}`)
  }
  const runId = runInsert.data.id as string
  console.log(`Sync run ${runId} started at ${startedAt.toISOString()}`)

  const repos = await listRepos()
  console.log(`Discovered ${repos.length} repos in ${COMMUNITY_ORG}`)

  const registries: RepoRegistry[] = []
  const snapshots: RepoSnapshot[] = []
  let failures = 0

  for (let i = 0; i < repos.length; i++) {
    const repo = repos[i]
    const label = `[${i + 1}/${repos.length}] ${repo.name}`
    try {
      const result = await collectForRepo(repo.name, runId, new Date())
      if (!result) {
        failures++
        console.log(`${label} — SKIPPED (no details)`)
        continue
      }
      registries.push(result.registry)
      snapshots.push(result.snapshot)
      console.log(
        `${label} — score=${result.snapshot.computed_quality_score} stars=${result.snapshot.stars}`
      )
    } catch (error) {
      failures++
      console.warn(`${label} — FAILED: ${(error as Error).message}`)
    }
  }

  if (registries.length > 0) {
    const upsertRes = await supabase
      .from('community_repos')
      .upsert(registries, { onConflict: 'owner,name' })
    if (upsertRes.error) {
      throw new Error(`Failed to upsert repos: ${upsertRes.error.message}`)
    }
  }

  if (snapshots.length > 0) {
    // Chunk inserts to keep payload sizes reasonable.
    const chunkSize = 200
    for (let i = 0; i < snapshots.length; i += chunkSize) {
      const chunk = snapshots.slice(i, i + chunkSize)
      const insertRes = await supabase.from('community_repo_snapshots').insert(chunk)
      if (insertRes.error) {
        throw new Error(
          `Failed to insert snapshots [${i}..${i + chunk.length}): ${insertRes.error.message}`
        )
      }
    }
  }

  const finishedAt = new Date()
  const updateRes = await supabase
    .from('community_sync_runs')
    .update({
      finished_at: finishedAt.toISOString(),
      repos_seen: repos.length,
      repos_failed: failures,
    })
    .eq('id', runId)
  if (updateRes.error) {
    throw new Error(`Failed to close sync run: ${updateRes.error.message}`)
  }

  const durationMs = finishedAt.getTime() - startedAt.getTime()
  console.log(
    `Sync run ${runId} finished in ${(durationMs / 1000).toFixed(1)}s ` +
      `— ${snapshots.length} snapshots, ${failures} failures`
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
