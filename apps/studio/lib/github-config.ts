import { Buffer } from 'node:buffer'
import { parse as parseToml } from 'smol-toml'

import type {
  GitHubConfigFormat,
  GitHubConfigResponse,
  GitHubConfigSource,
} from './github-config.types'

const GITHUB_API_URL = 'https://api.github.com'

export const DEFAULT_GITHUB_CONFIG_PATHS = ['supabase/config.toml', 'supabase/config.json']

type GitHubConfigErrorCode =
  | 'CONFIG_NOT_FOUND'
  | 'CONFIG_UNAVAILABLE'
  | 'INVALID_CONFIG'
  | 'INVALID_REPOSITORY'
  | 'REPOSITORY_UNAVAILABLE'

interface GitHubRepositoryResponse {
  default_branch?: string
}

interface GitHubContentResponse {
  content?: string
  encoding?: string
  html_url?: string | null
  path?: string
  sha?: string
  type?: string
}

export class GitHubConfigError extends Error {
  constructor(
    readonly code: GitHubConfigErrorCode,
    message: string,
    readonly upstreamStatus?: number
  ) {
    super(message)
    this.name = 'GitHubConfigError'
  }
}

export interface FetchGitHubConfigOptions {
  repository: string
  branch?: string
  token?: string
  configPaths?: string[]
  includeOriginalContent?: boolean
  signal?: AbortSignal
  fetcher?: typeof fetch
}

export async function fetchGitHubConfig({
  repository,
  branch,
  token,
  configPaths = DEFAULT_GITHUB_CONFIG_PATHS,
  includeOriginalContent = false,
  signal,
  fetcher = fetch,
}: FetchGitHubConfigOptions): Promise<GitHubConfigResponse> {
  const normalizedRepository = repository.trim()
  if (!isValidRepository(normalizedRepository)) {
    throw new GitHubConfigError(
      'INVALID_REPOSITORY',
      'STUDIO_GITHUB_REPOSITORY must use the owner/repository format.'
    )
  }

  const normalizedPaths = [...new Set(configPaths.map((path) => path.trim()).filter(Boolean))]
  if (normalizedPaths.length === 0) {
    throw new GitHubConfigError('CONFIG_NOT_FOUND', 'No GitHub config path is configured.')
  }

  const headers = createGitHubHeaders(token)
  const requestedBranch = branch?.trim()
  const branchesTried: string[] = []

  if (requestedBranch) {
    branchesTried.push(requestedBranch)
    const config = await fetchGitHubConfigFromBranch({
      repository: normalizedRepository,
      branch: requestedBranch,
      configPaths: normalizedPaths,
      headers,
      includeOriginalContent,
      signal,
      fetcher,
    })
    if (config) return config
  }

  const defaultBranch = await getDefaultBranch({
    repository: normalizedRepository,
    headers,
    signal,
    fetcher,
  })

  if (defaultBranch !== requestedBranch) {
    branchesTried.push(defaultBranch)
    const config = await fetchGitHubConfigFromBranch({
      repository: normalizedRepository,
      branch: defaultBranch,
      configPaths: normalizedPaths,
      headers,
      includeOriginalContent,
      signal,
      fetcher,
    })
    if (config) return config
  }

  throw new GitHubConfigError(
    'CONFIG_NOT_FOUND',
    `No config file was found in ${normalizedRepository} on ${branchesTried.join(', ')}. Tried: ${normalizedPaths.join(', ')}.`
  )
}

async function fetchGitHubConfigFromBranch({
  repository,
  branch,
  configPaths,
  headers,
  includeOriginalContent,
  signal,
  fetcher,
}: {
  repository: string
  branch: string
  configPaths: string[]
  headers: Headers
  includeOriginalContent: boolean
  signal?: AbortSignal
  fetcher: typeof fetch
}): Promise<GitHubConfigResponse | undefined> {
  for (const configPath of configPaths) {
    const response = await fetcher(createContentsUrl(repository, configPath, branch), {
      headers,
      signal,
    })

    if (response.status === 404) continue
    if (!response.ok) {
      const message = await readGitHubError(response)
      throw new GitHubConfigError(
        'CONFIG_UNAVAILABLE',
        `GitHub could not read ${configPath} from ${repository}@${branch}: ${message}`,
        response.status
      )
    }

    const payload = (await response.json()) as GitHubContentResponse
    if (payload.type !== 'file' || payload.encoding !== 'base64' || !payload.content) {
      throw new GitHubConfigError(
        'CONFIG_UNAVAILABLE',
        `GitHub returned an unsupported response for ${configPath}.`
      )
    }

    const format = getConfigFormat(payload.path ?? configPath)
    const content = Buffer.from(payload.content.replaceAll('\n', ''), 'base64').toString('utf8')
    const config = parseConfig(content, format, payload.path ?? configPath)
    const source: GitHubConfigSource = {
      repository,
      branch,
      path: payload.path ?? configPath,
      format,
      sha: payload.sha ?? '',
      htmlUrl: payload.html_url ?? null,
    }

    return {
      source,
      config,
      managedPaths: listManagedConfigPaths(config),
      ...(includeOriginalContent ? { originalContent: content } : {}),
    }
  }
}

export function parseConfig(
  content: string,
  format: GitHubConfigFormat,
  source = `config.${format}`
): Record<string, unknown> {
  let parsed: unknown

  try {
    parsed = format === 'toml' ? parseToml(content) : JSON.parse(content)
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new GitHubConfigError(
      'INVALID_CONFIG',
      `${source} is not valid ${format.toUpperCase()}: ${reason}`
    )
  }

  if (!isRecord(parsed)) {
    throw new GitHubConfigError('INVALID_CONFIG', `${source} must contain a config object.`)
  }

  return parsed
}

export function listManagedConfigPaths(config: Record<string, unknown>): string[] {
  return listLeafPaths(config).sort((left, right) => left.localeCompare(right))
}

function listLeafPaths(value: unknown, prefix = ''): string[] {
  if (!isRecord(value) || value instanceof Date) return prefix ? [prefix] : []

  const entries = Object.entries(value)
  if (entries.length === 0) return prefix ? [prefix] : []

  return entries.flatMap(([key, child]) => listLeafPaths(child, prefix ? `${prefix}.${key}` : key))
}

async function getDefaultBranch({
  repository,
  headers,
  signal,
  fetcher,
}: {
  repository: string
  headers: Headers
  signal?: AbortSignal
  fetcher: typeof fetch
}): Promise<string> {
  const response = await fetcher(`${GITHUB_API_URL}/repos/${repository}`, { headers, signal })
  if (!response.ok) {
    const message = await readGitHubError(response)
    throw new GitHubConfigError(
      'REPOSITORY_UNAVAILABLE',
      `GitHub could not read ${repository}: ${message}`,
      response.status
    )
  }

  const payload = (await response.json()) as GitHubRepositoryResponse
  if (!payload.default_branch) {
    throw new GitHubConfigError(
      'REPOSITORY_UNAVAILABLE',
      `GitHub did not return a default branch for ${repository}.`
    )
  }
  return payload.default_branch
}

function createContentsUrl(repository: string, configPath: string, branch: string): string {
  const encodedPath = configPath.split('/').map(encodeURIComponent).join('/')
  const url = new URL(`${GITHUB_API_URL}/repos/${repository}/contents/${encodedPath}`)
  url.searchParams.set('ref', branch)
  return url.toString()
}

function createGitHubHeaders(token?: string): Headers {
  const headers = new Headers({
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'supabase-studio-github-config-prototype',
  })
  if (token?.trim()) headers.set('Authorization', `Bearer ${token.trim()}`)
  return headers
}

async function readGitHubError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string }
    return payload.message ?? `HTTP ${response.status}`
  } catch {
    return `HTTP ${response.status}`
  }
}

function getConfigFormat(configPath: string): GitHubConfigFormat {
  if (configPath.toLowerCase().endsWith('.toml')) return 'toml'
  if (configPath.toLowerCase().endsWith('.json')) return 'json'
  throw new GitHubConfigError(
    'INVALID_CONFIG',
    `${configPath} has an unsupported format. Expected .toml or .json.`
  )
}

function isValidRepository(repository: string): boolean {
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
