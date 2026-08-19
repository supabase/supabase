import {
  CONFIG_SECTIONS,
  getFieldDefinition,
  getSectionFieldEntries,
  isSecretConfigField,
  setConfigValue,
  type ConfigDriftDashboardConfig,
} from './github-config-field-registry'
import { gitHubConfigTomlSchema, type GitHubConfigToml } from './github-config.types'

/**
 * Reshapes a project's dashboard config (sections keyed by section name, fields in their
 * dashboard-native naming) into the nested, dotted-path shape of a parsed config.toml — using the
 * same field registry the drift comparison compares against, so only trackable fields carry over.
 */
export function convertProjectConfigToGitHubConfig(
  dashboardConfig?: ConfigDriftDashboardConfig
): GitHubConfigToml {
  const githubConfig: Record<string, unknown> = {}
  if (!dashboardConfig) return gitHubConfigTomlSchema.parse(githubConfig)

  for (const section of CONFIG_SECTIONS) {
    const sectionConfig = dashboardConfig[section]
    if (!sectionConfig) continue

    for (const { fieldName, rawValue } of getSectionFieldEntries(section, sectionConfig)) {
      const definition = getFieldDefinition(section, fieldName)
      if (!definition || isSecretConfigField(definition.configPath)) continue

      const value = definition.normalizeDashboardValue?.(rawValue) ?? rawValue
      setConfigValue(githubConfig, definition.configPath, value)
    }
  }

  return gitHubConfigTomlSchema.parse(githubConfig)
}
