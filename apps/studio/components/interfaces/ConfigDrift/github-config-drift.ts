import {
  CONFIG_SECTIONS,
  getConfigValue,
  getFieldDefinition,
  getSectionFieldEntries,
  isSecretConfigField,
  type ConfigSection,
} from './github-config-field-registry'
import { gitHubConfigTomlSchema, type GitHubConfigToml } from './github-config.types'

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

function getConfigFieldState({
  configPath,
  dashboardConfig,
  githubConfig,
}: {
  configPath: string
  dashboardConfig: GitHubConfigToml
  githubConfig?: GitHubConfigToml
}): GitHubConfigFieldState {
  const definition = getFieldDefinition(configPath)
  if (!definition || !githubConfig || isSecretConfigField(definition.configPath)) {
    return { status: 'unmanaged' }
  }

  const normalizedDashboardValue = getConfigValue(dashboardConfig, definition.configPath)

  let githubValue = getConfigValue(githubConfig, definition.configPath)
  if (githubValue === undefined) {
    const isCodeOwned = getConfigValue(githubConfig, 'config_source') === 'code'
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
  dashboardConfig?: GitHubConfigToml
  githubConfig?: GitHubConfigToml
}): GitHubConfigDriftSummary {
  if (!dashboardConfig || !githubConfig) {
    return { managedCount: 0, driftedFields: [], unmanagedFields: [] }
  }

  const githubConfigResult = gitHubConfigTomlSchema.safeParse(githubConfig)
  const dashboardConfigResult = gitHubConfigTomlSchema.safeParse(dashboardConfig)
  if (!githubConfigResult.success || !dashboardConfigResult.success) {
    return { managedCount: 0, driftedFields: [], unmanagedFields: [] }
  }
  const cleanedGithubConfig = githubConfigResult.data
  const cleanedDashboardConfig = dashboardConfigResult.data

  let managedCount = 0
  const driftedFields: GitHubConfigDriftField[] = []
  const unmanagedFields: UnmanagedConfigField[] = []

  for (const section of CONFIG_SECTIONS) {
    const sectionConfig = cleanedDashboardConfig[section]
    if (!sectionConfig) continue

    for (const { configPath, rawValue } of getSectionFieldEntries(section, sectionConfig)) {
      const state = getConfigFieldState({
        configPath,
        dashboardConfig,
        githubConfig: cleanedGithubConfig,
      })

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
