import {
  CliConfigSchema,
  diffProjectConfig,
  fromApiProjectConfig,
  type CliConfig,
  type ConfigChange,
  type ProjectConfig,
} from '@supabase/config'
import { Result, Schema, SchemaIssue } from 'effect'
import { isPlainObject, lowerFirst } from 'lodash'

import {
  CONFIG_SECTIONS,
  getFieldDefinition,
  getSectionFieldEntries,
  toProjectHomepageHref,
  type ConfigSection,
} from './ConfigurationDriftPage.constants'

export interface GitHubConfigDriftField {
  section: ConfigSection
  configPath: string
  settingHref: (projectRef: string) => string
  dashboardValue: unknown
  githubValue: unknown
}

export interface UnmanagedConfigField {
  section: ConfigSection
  configPath: string
  dashboardValue: unknown
}

export interface MatchedConfigField {
  section: ConfigSection
  configPath: string
  value: unknown
}

export interface GitHubConfigDriftSummary {
  driftedFields: GitHubConfigDriftField[]
  matchedFields: MatchedConfigField[]
  unmanagedFields: UnmanagedConfigField[]
}

export interface GitHubConfigDecodeIssue {
  path: string // e.g. 'api.max_rows'
  message: string
}

export type GitHubConfigDecodeResult =
  | { status: 'success'; config: CliConfig; document: Record<string, unknown> }
  | { status: 'invalid'; issues: GitHubConfigDecodeIssue[] }

const EMPTY_SUMMARY: GitHubConfigDriftSummary = {
  driftedFields: [],
  matchedFields: [],
  unmanagedFields: [],
}

/**
 * Converts a v2 project-config API response's `attributes` into the hosted-section shape both
 * sides of a drift comparison are normalized to. Returns `undefined` when `attributes` isn't
 * loaded yet; throws if the API returned something @supabase/config can't map, so callers can
 * surface it as an error rather than silently reporting no drift.
 */
export function fromDashboardProjectConfig(attributes: unknown): ProjectConfig | undefined {
  if (attributes === undefined) return undefined
  return fromApiProjectConfig(attributes)
}

/**
 * Decodes a parsed config.toml document into the `{ config, document }` pair `diffProjectConfig`
 * takes as its local operand. Keeping the raw `document` alongside the decoded `config` is what
 * unlocks raw-presence masking (distinguishing "the file wrote this value" from "the file inherited
 * a schema default") — see `DiffProjectConfigOptions.local`'s own docstring. Returns `undefined`
 * when `document` isn't loaded yet; returns `{ status: 'invalid', issues }` when it fails to decode
 * against the schema, so callers can surface the offending path(s) rather than silently reporting
 * no drift.
 */
export function decodeGithubConfigDocument(
  document: unknown
): GitHubConfigDecodeResult | undefined {
  if (!isRecord(document)) return undefined

  const result = Schema.decodeUnknownResult(CliConfigSchema, { errors: 'all' })(document)
  if (Result.isFailure(result)) {
    const formatter = SchemaIssue.makeFormatterStandardSchemaV1()
    const issues = formatter(result.failure.issue).issues.map((issue) => ({
      path: (issue.path ?? []).map(String).join('.'),
      message: issue.message,
    }))
    return { status: 'invalid', issues }
  }

  return { status: 'success', config: result.success, document }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value)
}

/**
 * Whether `configPath` (dotted, e.g. `api.max_rows`) is declared anywhere in the raw config.toml
 * document — walking the parsed document itself rather than the decoded config, since decoding
 * fills in schema defaults for every field the file never mentioned. This is the only reliable way
 * to tell "config.toml set this" apart from "config.toml is silent and this happens to equal the
 * default" — a distinction `diffProjectConfig`'s change classification collapses when the two
 * sides' values coincide.
 */
function isPathDeclaredInDocument(
  document: Record<string, unknown> | undefined,
  configPath: string
): boolean {
  let current: unknown = document
  for (const segment of configPath.split('.')) {
    if (!isRecord(current) || !(segment in current)) return false
    current = current[segment]
  }
  return true
}

export type ConfigDriftResult =
  | { status: 'success'; summary: GitHubConfigDriftSummary }
  | { status: 'invalid-config'; issues: GitHubConfigDecodeIssue[] }

/**
 * Returns `{ status: 'invalid-config', issues }` if `githubConfig` fails to decode against the
 * schema (see `decodeGithubConfigDocument`), so callers can surface the offending path(s) instead
 * of silently reporting no drift.
 */
export function getConfigDriftSummary({
  dashboardConfig,
  githubConfig,
}: {
  dashboardConfig?: ProjectConfig
  githubConfig?: Record<string, unknown>
}): ConfigDriftResult {
  if (!dashboardConfig || !githubConfig) {
    return { status: 'success', summary: EMPTY_SUMMARY }
  }

  const decodedGithubConfig = decodeGithubConfigDocument(githubConfig)
  if (!decodedGithubConfig) {
    return { status: 'success', summary: EMPTY_SUMMARY }
  }
  if (decodedGithubConfig.status === 'invalid') {
    return { status: 'invalid-config', issues: decodedGithubConfig.issues }
  }

  const changeSet = diffProjectConfig({
    local: { config: decodedGithubConfig.config, document: decodedGithubConfig.document },
    remote: dashboardConfig,
  })

  const changesByPath = new Map<string, ConfigChange>(
    changeSet.changes.map((change) => [change.path.join('.'), change])
  )
  const maskedPaths = new Set(changeSet.masked.map((path) => path.join('.')))
  const unmanagedByPushPaths = new Set(changeSet.unmanaged.map((path) => path.join('.')))

  const driftedFields: GitHubConfigDriftField[] = []
  const matchedFields: MatchedConfigField[] = []
  const unmanagedFields: UnmanagedConfigField[] = []

  for (const section of CONFIG_SECTIONS) {
    const sectionConfig = dashboardConfig[section]
    if (!sectionConfig) continue

    for (const { configPath, rawValue } of getSectionFieldEntries(section, sectionConfig)) {
      if (maskedPaths.has(configPath)) continue

      const change = changesByPath.get(configPath)
      if (change) {
        const definition = getFieldDefinition(configPath)

        driftedFields.push({
          section,
          configPath,
          settingHref: definition?.settingHref ?? toProjectHomepageHref,
          dashboardValue: change.remote,
          githubValue: change.local,
        })
        continue
      }

      const isTrackedInConfigToml = isPathDeclaredInDocument(
        decodedGithubConfig.document,
        configPath
      )
      if (unmanagedByPushPaths.has(configPath) || !isTrackedInConfigToml) {
        unmanagedFields.push({ section, configPath, dashboardValue: rawValue })
        continue
      }

      matchedFields.push({ section, configPath, value: rawValue })
    }
  }

  return { status: 'success', summary: { driftedFields, matchedFields, unmanagedFields } }
}

/**
 * Turns `GitHubConfigDecodeIssue[]` into a single-sentence, user-facing message for `AlertError`,
 * which renders `error.message` in a `<p>` — Effect's own multi-line default reads badly there.
 */
export function formatGitHubConfigDecodeMessage(issues: GitHubConfigDecodeIssue[]): string {
  if (issues.length === 1) {
    const [issue] = issues
    return `config.toml has an invalid value at ${issue.path}: ${lowerFirst(issue.message)}.`
  }

  const details = issues.map((issue) => `${issue.path} (${lowerFirst(issue.message)})`).join(', ')
  return `config.toml has invalid values: ${details}.`
}
