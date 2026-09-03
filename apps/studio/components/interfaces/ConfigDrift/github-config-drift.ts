import {
  CliConfigSchema,
  fromApiProjectConfig,
  type CliConfig,
  type EffectiveConfig,
  type ProjectConfig,
} from '@supabase/config'
import { diffProjectConfig, type ConfigChange } from '@supabase/config/internal'
import { Schema } from 'effect'
import { isPlainObject } from 'lodash'

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

interface GitHubConfigDriftSummary {
  driftedFields: GitHubConfigDriftField[]
  matchedFields: MatchedConfigField[]
  unmanagedFields: UnmanagedConfigField[]
}

/**
 * Converts a v2 project-config API response's `attributes` into the hosted-section shape both
 * sides of a drift comparison are normalized to. Returns `undefined` (rather than throwing) when
 * `attributes` isn't loaded yet or the API returned something @supabase/config can't map.
 */
export function fromDashboardProjectConfig(attributes: unknown): ProjectConfig | undefined {
  if (attributes === undefined) return undefined
  try {
    return fromApiProjectConfig(attributes)
  } catch {
    return undefined
  }
}

/**
 * Decodes a parsed config.toml document into the `{ config, document }` pair `diffProjectConfig`
 * takes as its local operand. Keeping the raw `document` alongside the decoded `config` is what
 * unlocks raw-presence masking (distinguishing "the file wrote this value" from "the file inherited
 * a schema default") — see `DiffProjectConfigOptions.local`'s own docstring. Returns `undefined`
 * (rather than throwing) when `document` isn't loaded yet or fails to decode against the schema.
 */
export function decodeGithubConfigDocument(
  document: unknown
): { config: CliConfig; document: Record<string, unknown> } | undefined {
  if (!isRecord(document)) return undefined
  try {
    const config = Schema.decodeUnknownSync(CliConfigSchema)(document)
    return { config, document }
  } catch {
    return undefined
  }
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

export function getConfigDriftSummary({
  dashboardConfig,
  githubConfig,
}: {
  dashboardConfig?: ProjectConfig
  githubConfig?: EffectiveConfig
}): GitHubConfigDriftSummary {
  if (!dashboardConfig || !githubConfig) {
    return { driftedFields: [], matchedFields: [], unmanagedFields: [] }
  }

  const decodedGithubConfig = decodeGithubConfigDocument(githubConfig)
  if (!decodedGithubConfig) {
    return { driftedFields: [], matchedFields: [], unmanagedFields: [] }
  }

  const changeSet = diffProjectConfig({
    local: decodedGithubConfig,
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

  return { driftedFields, matchedFields, unmanagedFields }
}
