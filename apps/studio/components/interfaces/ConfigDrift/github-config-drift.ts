import {
  CliConfigSchema,
  fromApiProjectConfig,
  fromConfigDocument,
  type CliConfig,
  type EffectiveConfig,
  type ProjectConfig,
} from '@supabase/config'
import { Schema } from 'effect'

import {
  CONFIG_SECTIONS,
  getConfigValue,
  getFieldDefinition,
  getSectionFieldEntries,
  isSecretConfigField,
  type ConfigSection,
} from './github-config-field-registry'

type GitHubConfigFieldStatus = 'unmanaged' | 'managed' | 'drifted'

interface GitHubConfigFieldState {
  status: GitHubConfigFieldStatus
  configPath?: string
  settingHref?: (projectRef: string) => string
  githubValue?: unknown
}

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

interface GitHubConfigDriftSummary {
  managedCount: number
  driftedFields: GitHubConfigDriftField[]
  unmanagedFields: UnmanagedConfigField[]
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isEffectiveConfigLike(value: unknown): value is EffectiveConfig {
  return isPlainObject(value)
}

/**
 * Converts a v2 project-config API response's `attributes` into the hosted-section shape both
 * sides of a drift comparison are normalized to. Returns `undefined` (rather than throwing) when
 * `attributes` isn't loaded yet or the API returned something @supabase/config can't map.
 */
export function toDashboardProjectConfig(attributes: unknown): ProjectConfig | undefined {
  if (attributes === undefined) return undefined
  try {
    return fromApiProjectConfig(attributes)
  } catch {
    return undefined
  }
}

/**
 * Converts a parsed config.toml document into the same hosted-section shape as the dashboard side.
 */
export function toGithubProjectConfig(document: unknown): ProjectConfig | undefined {
  if (!isEffectiveConfigLike(document)) return undefined

  try {
    const githubCompleteConfig: CliConfig = Schema.decodeUnknownSync(CliConfigSchema)(document)
    const githubProjectConfig = fromConfigDocument(githubCompleteConfig)
    return githubProjectConfig
  } catch {
    return undefined
  }
}

function getConfigFieldState({
  configPath,
  dashboardConfig,
  githubConfig,
}: {
  configPath: string
  dashboardConfig: ProjectConfig
  githubConfig?: ProjectConfig
}): GitHubConfigFieldState {
  const definition = getFieldDefinition(configPath)
  if (!definition || !githubConfig || isSecretConfigField(definition.configPath)) {
    return { status: 'unmanaged' }
  }

  const dashboardValue = getConfigValue(dashboardConfig, definition.configPath)
  const githubValue = getConfigValue(githubConfig, definition.configPath)

  return {
    status: valuesMatch(dashboardValue, githubValue) ? 'managed' : 'drifted',
    configPath: definition.configPath,
    settingHref: definition.settingHref,
    githubValue,
  }
}

export function getConfigDriftSummary({
  dashboardConfig,
  githubConfig,
}: {
  dashboardConfig?: ProjectConfig
  githubConfig?: ProjectConfig
}): GitHubConfigDriftSummary {
  if (!dashboardConfig || !githubConfig) {
    return { managedCount: 0, driftedFields: [], unmanagedFields: [] }
  }

  let managedCount = 0
  const driftedFields: GitHubConfigDriftField[] = []
  const unmanagedFields: UnmanagedConfigField[] = []

  for (const section of CONFIG_SECTIONS) {
    const sectionConfig = dashboardConfig[section]
    if (!sectionConfig) continue

    for (const { configPath, rawValue } of getSectionFieldEntries(section, sectionConfig)) {
      if (isSecretConfigField(configPath)) continue

      const state = getConfigFieldState({ configPath, dashboardConfig, githubConfig })

      if (state.status === 'managed') {
        managedCount += 1
        continue
      }
      if (state.status === 'unmanaged' || !state.configPath || !state.settingHref) {
        unmanagedFields.push({ section, configPath, dashboardValue: rawValue })
        continue
      }

      driftedFields.push({
        section,
        configPath: state.configPath,
        settingHref: state.settingHref,
        dashboardValue: rawValue,
        githubValue: state.githubValue,
      })
    }
  }

  return { managedCount, driftedFields, unmanagedFields }
}

function valuesMatch(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}
