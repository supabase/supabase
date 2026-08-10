import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import { parse as parseToml, stringify as stringifyToml } from 'smol-toml'

import { getAuthFieldConfigPath, getConfigValue } from './github-config-drift'
import { resolveEffectiveGitHubConfig, type GitHubConfigTarget } from './github-config-effective'
import type { GitHubConfigPullRequestResponse, GitHubConfigResponse } from './github-config.types'

const GITHUB_API_URL = 'https://api.github.com'
const SECRET_FIELD_PATTERN = /(?:SECRET|TOKEN|API_KEY|ACCESS_KEY)$/
const ACCEPT_REMOTE_CONFIGURATION_TITLE = 'Accept remote configuration'

export class GitHubConfigPullRequestError extends Error {
  constructor(
    readonly code:
      | 'GITHUB_WRITE_NOT_CONFIGURED'
      | 'INVALID_ACCEPT_REQUEST'
      | 'CONFIG_CHANGED'
      | 'GITHUB_WRITE_FAILED',
    message: string,
    readonly upstreamStatus?: number
  ) {
    super(message)
    this.name = 'GitHubConfigPullRequestError'
  }
}

export interface CreateGitHubConfigPullRequestOptions {
  repository: string
  token: string
  source: GitHubConfigResponse
  changes: readonly {
    fieldName: string
    dashboardValue: unknown
  }[]
  target: GitHubConfigTarget
  gitBranch?: string
  fetcher?: typeof fetch
  branchName?: string
}

export async function createGitHubConfigPullRequest({
  repository,
  token,
  source,
  changes,
  target,
  gitBranch,
  fetcher = fetch,
  branchName = createPullRequestBranchName(),
}: CreateGitHubConfigPullRequestOptions): Promise<GitHubConfigPullRequestResponse> {
  if (!token.trim()) {
    throw new GitHubConfigPullRequestError(
      'GITHUB_WRITE_NOT_CONFIGURED',
      'STUDIO_GITHUB_TOKEN is required to create configuration pull requests.'
    )
  }

  if (changes.length === 0) {
    throw new GitHubConfigPullRequestError(
      'INVALID_ACCEPT_REQUEST',
      'There are no configuration differences to accept.'
    )
  }

  const normalizedChanges = changes.map(({ fieldName, dashboardValue }) => ({
    configPath: getWritableAuthConfigPath(fieldName),
    configValue: normalizeDashboardValueForConfig(fieldName, dashboardValue),
  }))
  let updatedConfig = source.config
  for (const { configPath, configValue } of normalizedChanges) {
    updatedConfig = applyConfigValueToTarget({
      config: updatedConfig,
      configPath,
      value: configValue,
      target,
      gitBranch,
    })
  }
  const effectiveConfig = resolveEffectiveGitHubConfig(updatedConfig, { target, gitBranch })

  for (const { configPath, configValue } of normalizedChanges) {
    if (!valuesMatch(getConfigValue(effectiveConfig, configPath), configValue)) {
      throw new GitHubConfigPullRequestError(
        'INVALID_ACCEPT_REQUEST',
        `Could not safely apply the live value to ${configPath}.`
      )
    }
  }

  const serializedConfig = serializeConfig({
    config: updatedConfig,
    format: source.source.format,
    originalContent: source.originalContent,
    changes: normalizedChanges,
    target,
    gitBranch,
  })
  const serializedEffectiveConfig = resolveEffectiveGitHubConfig(
    parseSerializedConfig(serializedConfig, source.source.format),
    { target, gitBranch }
  )
  for (const { configPath, configValue } of normalizedChanges) {
    if (!valuesMatch(getConfigValue(serializedEffectiveConfig, configPath), configValue)) {
      throw new GitHubConfigPullRequestError(
        'INVALID_ACCEPT_REQUEST',
        `Could not safely write the live value to ${configPath}.`
      )
    }
  }

  const headers = createGitHubWriteHeaders(token)
  const branchHead = await requestJson<{ object?: { sha?: string } }>(
    fetcher,
    `${GITHUB_API_URL}/repos/${repository}/git/ref/heads/${encodeGitRef(source.source.branch)}`,
    { headers },
    'read the source branch'
  )
  const branchHeadSha = branchHead.object?.sha
  if (!branchHeadSha) {
    throw new GitHubConfigPullRequestError(
      'GITHUB_WRITE_FAILED',
      `GitHub did not return the head commit for ${source.source.branch}.`
    )
  }

  await requestJson(
    fetcher,
    `${GITHUB_API_URL}/repos/${repository}/git/refs`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: branchHeadSha }),
    },
    'create the configuration branch'
  )

  const updateResponse = await requestJson<{ commit?: { sha?: string } }>(
    fetcher,
    createContentsUrl(repository, source.source.path),
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: 'chore: accept remote configuration',
        content: Buffer.from(serializedConfig).toString('base64'),
        sha: source.source.sha,
        branch: branchName,
      }),
    },
    'commit the configuration change'
  )
  const commitSha = updateResponse.commit?.sha
  if (!commitSha) {
    throw new GitHubConfigPullRequestError(
      'GITHUB_WRITE_FAILED',
      `GitHub created ${branchName}, but did not return the configuration commit SHA.`
    )
  }

  const pullRequest = await requestJson<{ html_url?: string; number?: number }>(
    fetcher,
    `${GITHUB_API_URL}/repos/${repository}/pulls`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: ACCEPT_REMOTE_CONFIGURATION_TITLE,
        head: branchName,
        base: source.source.branch,
        body: [
          '## Configuration drift',
          '',
          `Accepts ${normalizedChanges.length} live dashboard ${normalizedChanges.length === 1 ? 'value' : 'values'} into \`${source.source.path}\`.`,
          '',
          ...normalizedChanges.map(({ configPath }) => `- \`${configPath}\``),
          '',
          'This pull request does not change the live deployment.',
        ].join('\n'),
      }),
    },
    'open the configuration pull request'
  )

  if (!pullRequest.html_url || typeof pullRequest.number !== 'number') {
    throw new GitHubConfigPullRequestError(
      'GITHUB_WRITE_FAILED',
      `GitHub committed ${branchName}, but did not return a pull request URL.`
    )
  }

  return {
    pullRequestUrl: pullRequest.html_url,
    pullRequestNumber: pullRequest.number,
    pullRequestTitle: ACCEPT_REMOTE_CONFIGURATION_TITLE,
    branch: branchName,
    commitSha,
    affectedPaths: normalizedChanges.map(({ configPath }) => configPath),
  }
}

export function applyConfigValueToTarget({
  config,
  configPath,
  value,
  target,
  gitBranch,
}: {
  config: Record<string, unknown>
  configPath: string
  value: unknown
  target: GitHubConfigTarget
  gitBranch?: string
}): Record<string, unknown> {
  const result = structuredClone(config)
  const env = ensureRecord(result, 'env')
  let targetConfig: Record<string, unknown>

  if (target === 'preview') {
    if (!gitBranch?.trim()) {
      throw new GitHubConfigPullRequestError(
        'INVALID_ACCEPT_REQUEST',
        'A Git branch is required to accept a preview deployment value.'
      )
    }

    const preview = ensureRecord(env, 'preview')
    const branches = ensureRecord(preview, 'branches')
    targetConfig = ensureRecord(branches, gitBranch)
  } else {
    targetConfig = ensureRecord(env, target)
  }

  setConfigValue(targetConfig, configPath, value)
  return result
}

export function normalizeDashboardValueForConfig(fieldName: string, value: unknown): unknown {
  if (SECRET_FIELD_PATTERN.test(fieldName)) {
    throw new GitHubConfigPullRequestError(
      'INVALID_ACCEPT_REQUEST',
      'Secret settings cannot be written to config.toml.'
    )
  }

  if (fieldName === 'URI_ALLOW_LIST') {
    const urls = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : null
    if (!urls || urls.some((url) => typeof url !== 'string')) {
      throw invalidValue(fieldName)
    }
    return Array.from(new Set(urls.map((url) => url.trim()).filter(Boolean)))
  }

  if (fieldName === 'PASSWORD_REQUIRED_CHARACTERS' && value === 'NO_REQUIRED_CHARS') return ''

  if (
    typeof value !== 'string' &&
    typeof value !== 'boolean' &&
    typeof value !== 'number' &&
    value !== null
  ) {
    throw invalidValue(fieldName)
  }
  return value
}

function getWritableAuthConfigPath(fieldName: string): string {
  const configPath = getAuthFieldConfigPath(fieldName)
  if (
    !configPath ||
    SECRET_FIELD_PATTERN.test(fieldName) ||
    configPath.split('.').includes('secret')
  ) {
    throw new GitHubConfigPullRequestError(
      'INVALID_ACCEPT_REQUEST',
      `Unsupported Auth setting: ${fieldName}`
    )
  }
  return configPath
}

function ensureRecord(parent: Record<string, unknown>, key: string): Record<string, unknown> {
  const current = parent[key]
  if (isRecord(current)) return current
  const created: Record<string, unknown> = {}
  parent[key] = created
  return created
}

function setConfigValue(config: Record<string, unknown>, configPath: string, value: unknown) {
  const segments = configPath.split('.')
  const key = segments.pop()
  if (!key) throw new GitHubConfigPullRequestError('INVALID_ACCEPT_REQUEST', 'Invalid path.')

  let parent = config
  for (const segment of segments) parent = ensureRecord(parent, segment)
  parent[key] = value
}

function serializeConfig({
  config,
  format,
  originalContent,
  changes,
  target,
  gitBranch,
}: {
  config: Record<string, unknown>
  format: 'toml' | 'json'
  originalContent?: string
  changes: readonly { configPath: string; configValue: unknown }[]
  target: GitHubConfigTarget
  gitBranch?: string
}): string {
  if (format === 'json') return `${JSON.stringify(config, null, 2)}\n`

  if (originalContent !== undefined) {
    return patchTomlConfig(
      originalContent,
      changes.map(({ configPath, configValue }) => ({
        path: getTargetConfigPath(configPath, target, gitBranch),
        value: configValue,
      }))
    )
  }

  const serialized = indentTomlTables(compactTomlArrayPadding(stringifyToml(config)))
  return serialized.endsWith('\n') ? serialized : `${serialized}\n`
}

function parseSerializedConfig(content: string, format: 'toml' | 'json'): Record<string, unknown> {
  try {
    const parsed: unknown = format === 'toml' ? parseToml(content) : JSON.parse(content)
    if (isRecord(parsed)) return parsed
  } catch {
    // Replaced with a safe, stable error below.
  }
  throw new GitHubConfigPullRequestError(
    'INVALID_ACCEPT_REQUEST',
    'Could not safely write the configuration file.'
  )
}

function getTargetConfigPath(
  configPath: string,
  target: GitHubConfigTarget,
  gitBranch?: string
): string[] {
  const configSegments = configPath.split('.')
  if (target !== 'preview') return ['env', target, ...configSegments]
  if (!gitBranch?.trim()) {
    throw new GitHubConfigPullRequestError(
      'INVALID_ACCEPT_REQUEST',
      'A Git branch is required to accept a preview deployment value.'
    )
  }
  return ['env', 'preview', 'branches', gitBranch, ...configSegments]
}

/** Apply only the requested TOML assignments, leaving all other bytes structurally untouched. */
function patchTomlConfig(
  content: string,
  patches: readonly { path: string[]; value: unknown }[]
): string {
  const newline = content.includes('\r\n') ? '\r\n' : '\n'
  const hadFinalNewline = content.endsWith(newline)
  const lines = content.split(/\r?\n/)

  for (const { path, value } of patches) {
    const tablePath = path.slice(0, -1)
    const key = path.at(-1)
    if (!key) {
      throw new GitHubConfigPullRequestError('INVALID_ACCEPT_REQUEST', 'Invalid path.')
    }

    const table = findTomlTable(lines, tablePath)
    const serializedValue = serializeTomlValue(value)
    if (table === undefined) {
      appendTomlTable(lines, tablePath, key, serializedValue, hadFinalNewline)
      continue
    }

    const nextTable = findNextTomlTable(lines, table + 1)
    const assignment = findTomlAssignment(lines, table + 1, nextTable, key)
    if (assignment) {
      const firstLine = lines[assignment.start]
      const equals = firstLine.indexOf('=')
      const valueStart = equals + 1 + (firstLine.slice(equals + 1).match(/^\s*/)?.[0].length ?? 0)
      const suffix = getTomlAssignmentSuffix(lines[assignment.end])
      lines.splice(
        assignment.start,
        assignment.end - assignment.start + 1,
        `${firstLine.slice(0, valueStart)}${serializedValue}${suffix}`
      )
      continue
    }

    let insertAt = nextTable
    while (insertAt > table + 1 && lines[insertAt - 1].trim() === '') insertAt -= 1
    lines.splice(insertAt, 0, `${getTableIndent(lines[table])}${key} = ${serializedValue}`)
  }

  return lines.join(newline)
}

function findTomlTable(
  lines: readonly string[],
  expectedPath: readonly string[]
): number | undefined {
  for (let index = 0; index < lines.length; index += 1) {
    const path = getTomlTablePath(lines[index].trimStart())
    if (path !== null && pathsEqual(splitTomlPath(path), expectedPath)) return index
  }
}

function findNextTomlTable(lines: readonly string[], start: number): number {
  for (let index = start; index < lines.length; index += 1) {
    if (getTomlTablePath(lines[index].trimStart()) !== null) return index
  }
  return lines.length
}

function findTomlAssignment(
  lines: readonly string[],
  start: number,
  end: number,
  expectedKey: string
): { start: number; end: number } | undefined {
  for (let index = start; index < end; index += 1) {
    const match = lines[index].match(/^\s*([A-Za-z0-9_-]+)\s*=/)
    if (match?.[1] !== expectedKey) continue
    return { start: index, end: findTomlAssignmentEnd(lines, index, end) }
  }
}

function findTomlAssignmentEnd(lines: readonly string[], start: number, end: number): number {
  let quote: '"' | "'" | null = null
  let escaped = false
  let depth = 0

  for (let lineIndex = start; lineIndex < end; lineIndex += 1) {
    const line =
      lineIndex === start
        ? lines[lineIndex].slice(lines[lineIndex].indexOf('=') + 1)
        : lines[lineIndex]
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index]
      if (quote === '"') {
        if (escaped) escaped = false
        else if (character === '\\') escaped = true
        else if (character === quote) quote = null
        continue
      }
      if (quote === "'") {
        if (character === quote) quote = null
        continue
      }
      if (character === '"' || character === "'") quote = character
      else if (character === '[' || character === '{') depth += 1
      else if (character === ']' || character === '}') depth -= 1
      else if (character === '#' && depth === 0) break
    }
    if (quote === null && depth <= 0) return lineIndex
  }
  return start
}

function getTomlAssignmentSuffix(line: string): string {
  let quote: '"' | "'" | null = null
  let escaped = false
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (quote === '"') {
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === quote) quote = null
      continue
    }
    if (quote === "'") {
      if (character === quote) quote = null
      continue
    }
    if (character === '"' || character === "'") quote = character
    else if (character === '#') {
      const whitespaceStart = line.slice(0, index).search(/\s+$/)
      return line.slice(whitespaceStart === -1 ? index : whitespaceStart)
    }
  }
  return line.match(/\s*$/)?.[0] ?? ''
}

function appendTomlTable(
  lines: string[],
  tablePath: readonly string[],
  key: string,
  value: string,
  hadFinalNewline: boolean
) {
  if (hadFinalNewline && lines.at(-1) === '') lines.pop()
  if (lines.length > 0 && lines.at(-1)?.trim() !== '') lines.push('')
  const indent = getEnvironmentTableIndent(lines, tablePath)
  lines.push(`${indent}[${formatTomlPath(tablePath)}]`, `${indent}${key} = ${value}`)
  if (hadFinalNewline) lines.push('')
}

function getEnvironmentTableIndent(lines: readonly string[], tablePath: readonly string[]): string {
  if (tablePath[0] !== 'env' || tablePath.length <= 2) return ''
  for (const line of lines) {
    const path = getTomlTablePath(line.trimStart())
    if (path !== null) {
      const segments = splitTomlPath(path)
      if (segments[0] === 'env' && segments.length > 2) return getTableIndent(line)
    }
  }
  return '  '
}

function getTableIndent(line: string): string {
  return line.match(/^\s*/)?.[0] ?? ''
}

function formatTomlPath(path: readonly string[]): string {
  return path
    .map((segment) => (/^[A-Za-z0-9_-]+$/.test(segment) ? segment : JSON.stringify(segment)))
    .join('.')
}

function serializeTomlValue(value: unknown): string {
  const assignment = compactTomlArrayPadding(stringifyToml({ value })).trim()
  return assignment.slice(assignment.indexOf('=') + 1).trim()
}

function pathsEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((segment, index) => segment === right[index])
}

/** Match the CLI's compact config.toml array style without touching strings. */
function compactTomlArrayPadding(content: string): string {
  let output = ''
  let quote: '"' | "'" | null = null
  let escaped = false

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index]

    if (quote === '"') {
      output += character
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === quote) quote = null
      continue
    }

    if (quote === "'") {
      output += character
      if (character === quote) quote = null
      continue
    }

    if (character === '"' || character === "'") {
      quote = character
      output += character
      continue
    }

    if (character === '[' && content[index + 1] === ' ') {
      output += character
      index += 1
      continue
    }
    if (character === ' ' && content[index + 1] === ']') continue

    output += character
  }

  return output
}

/** Match the CLI's Wrangler-style visual nesting for environment descendants. */
function indentTomlTables(content: string): string {
  let assignmentIndent = ''
  const emittedTables = new Set<string>()
  const output: string[] = []

  for (const line of content.split('\n')) {
    const trimmed = line.trimStart()
    if (trimmed.length === 0) {
      output.push('')
      continue
    }

    const tablePath = getTomlTablePath(trimmed)
    if (tablePath !== null) {
      const segments = splitTomlPath(tablePath)
      const isEnvironmentDescendant = segments[0] === 'env' && segments.length > 2

      if (isEnvironmentDescendant) {
        const environmentScope = segments.slice(0, 2)
        const scopeIdentity = JSON.stringify(environmentScope)
        if (!emittedTables.has(scopeIdentity)) {
          output.push(`[${environmentScope.join('.')}]`, '')
          emittedTables.add(scopeIdentity)
        }
      }

      assignmentIndent = isEnvironmentDescendant ? '  ' : ''
      output.push(`${assignmentIndent}${trimmed}`)
      emittedTables.add(JSON.stringify(segments))
      continue
    }

    output.push(`${assignmentIndent}${trimmed}`)
  }

  return output.join('\n')
}

function getTomlTablePath(line: string): string | null {
  const table = line.match(/^\[([^\[].*?)\]\s*(?:#.*)?$/)
  if (table) return table[1]
  return null
}

function splitTomlPath(path: string): string[] {
  const segments: string[] = []
  let segmentStart = 0
  let quote: '"' | "'" | null = null
  let escaped = false

  for (let index = 0; index < path.length; index += 1) {
    const character = path[index]
    if (quote === '"') {
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === quote) quote = null
      continue
    }
    if (quote === "'") {
      if (character === quote) quote = null
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      continue
    }
    if (character === '.') {
      segments.push(path.slice(segmentStart, index).replace(/^['"]|['"]$/g, ''))
      segmentStart = index + 1
    }
  }

  segments.push(path.slice(segmentStart).replace(/^['"]|['"]$/g, ''))
  return segments
}

function createGitHubWriteHeaders(token: string): Headers {
  return new Headers({
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token.trim()}`,
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'supabase-studio-github-config-prototype',
  })
}

async function requestJson<T = Record<string, unknown>>(
  fetcher: typeof fetch,
  url: string,
  init: RequestInit,
  action: string
): Promise<T> {
  const response = await fetcher(url, init)
  if (!response.ok) {
    let message = `HTTP ${response.status}`
    try {
      const payload = (await response.json()) as { message?: string }
      if (payload.message) message = payload.message
    } catch {
      // Keep the status-only fallback.
    }
    throw new GitHubConfigPullRequestError(
      'GITHUB_WRITE_FAILED',
      `GitHub could not ${action}: ${message}`,
      response.status
    )
  }
  return (await response.json()) as T
}

function createContentsUrl(repository: string, path: string): string {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  return `${GITHUB_API_URL}/repos/${repository}/contents/${encodedPath}`
}

function encodeGitRef(branch: string): string {
  return branch.split('/').map(encodeURIComponent).join('/')
}

function createPullRequestBranchName(): string {
  const suffix = randomUUID().slice(0, 8)
  return `studio/config-drift-${suffix}`
}

function invalidValue(fieldName: string) {
  return new GitHubConfigPullRequestError(
    'INVALID_ACCEPT_REQUEST',
    `The live value for ${fieldName} cannot be written to config.toml.`
  )
}

function valuesMatch(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
