import {
  fromApiProjectConfig,
  fromConfigDocument,
  type EffectiveConfig,
  type ProjectConfig,
} from '@supabase/config'

import {
  CONFIG_SECTIONS,
  getConfigValue,
  getFieldDefinition,
  getSectionFieldEntries,
  isSecretConfigField,
  type ConfigSection,
} from './github-config-field-registry'

/**
 * The parsed-config.toml side additionally carries `config_source` -- the GitHub connections API's
 * own "is this config.toml owned by the repo" annotation, alongside the config.toml sections
 * themselves. It has no config.toml or @supabase/config counterpart, so it's threaded through
 * separately rather than folded into `ProjectConfig`.
 */
export type GitHubProjectConfig = ProjectConfig & { config_source?: string }

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
 * Converts a parsed config.toml document into the same hosted-section shape, preserving
 * `config_source` (see {@link GitHubProjectConfig}) since @supabase/config's projection drops it.
 */
export function toGithubProjectConfig(document: unknown): GitHubProjectConfig | undefined {
  const configSource =
    isPlainObject(document) && typeof document.config_source === 'string'
      ? document.config_source
      : undefined

  if (!isEffectiveConfigLike(document)) return undefined

  try {
    return { ...fromConfigDocument(document), config_source: configSource }
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
  githubConfig?: GitHubProjectConfig
}): GitHubConfigFieldState {
  const definition = getFieldDefinition(configPath)
  if (!definition || !githubConfig || isSecretConfigField(definition.configPath)) {
    return { status: 'unmanaged' }
  }

  const normalizedDashboardValue = getConfigValue(dashboardConfig, definition.configPath)

  let githubValue = getConfigValue(githubConfig, definition.configPath)
  if (githubValue === undefined) {
    const isCodeOwned = githubConfig.config_source === 'code'
    if (!isCodeOwned || definition.hostedDefault === undefined) return { status: 'unmanaged' }

    const normalizedDefaultValue =
      definition.normalizeGithubValue?.(definition.hostedDefault) ?? definition.hostedDefault
    if (valuesMatch(normalizedDashboardValue, normalizedDefaultValue)) {
      return { status: 'unmanaged' }
    }

    githubValue = definition.hostedDefault
  }

  const normalizedGithubValue = definition.normalizeGithubValue?.(githubValue) ?? githubValue
  return {
    status: valuesMatch(normalizedDashboardValue, normalizedGithubValue) ? 'managed' : 'drifted',
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
  githubConfig?: GitHubProjectConfig
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
