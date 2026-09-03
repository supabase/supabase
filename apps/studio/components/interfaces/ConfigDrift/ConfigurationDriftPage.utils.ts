import { startCase } from 'lodash'

import {
  CONFIG_SECTIONS,
  getFieldDefinition,
  type ConfigSection,
} from '@/components/interfaces/ConfigDrift/ConfigurationDriftPage.constants'
import {
  type GitHubConfigDriftField,
  type MatchedConfigField,
  type UnmanagedConfigField,
} from '@/components/interfaces/ConfigDrift/github-config-drift'

const CONFIG_SECTION_LABELS: Record<ConfigSection, string> = {
  api: 'API',
  auth: 'Auth',
  db: 'Database',
  realtime: 'Realtime',
  storage: 'Storage',
  workers: 'Workers',
  experimental: 'Experimental',
}

interface ConfigurationIssueRowMeta {
  settingLabel: string
  settingHref: string
  valueDiff: ConfigurationDriftValueDiff
}

export type ConfigurationDriftRow = Omit<GitHubConfigDriftField, 'settingHref'> &
  ConfigurationIssueRowMeta & { status: 'drifted' }

type ConfigurationDriftValueDiff = {
  kind: 'scalar'
  dashboardValue: string
  configValue: string
}

interface UnmanagedConfigRow {
  configPath: string
  label: string
  value: string
}

export interface ConfigSectionGroup {
  section: ConfigSection
  sectionLabel: string
  rows: UnmanagedConfigRow[]
}

export function createConfigurationDriftRows(
  fields: GitHubConfigDriftField[],
  projectRef: string
): ConfigurationDriftRow[] {
  return fields.map((field) => ({
    ...field,
    status: 'drifted' as const,
    settingLabel: getConfigFieldLabel(field.configPath),
    settingHref: field.settingHref(projectRef),
    valueDiff: createConfigurationDriftValueDiff(field),
  }))
}

export function groupUnmanagedConfigFields(
  fields: readonly UnmanagedConfigField[]
): ConfigSectionGroup[] {
  return groupConfigFieldsBySection(fields, (field) => field.dashboardValue)
}

export function groupMatchedConfigFields(
  fields: readonly MatchedConfigField[]
): ConfigSectionGroup[] {
  return groupConfigFieldsBySection(fields, (field) => field.value)
}

function groupConfigFieldsBySection<T extends { section: ConfigSection; configPath: string }>(
  fields: readonly T[],
  getValue: (field: T) => unknown
): ConfigSectionGroup[] {
  const bySection = new Map<ConfigSection, UnmanagedConfigRow[]>()

  for (const field of fields) {
    const rows = bySection.get(field.section) ?? []
    rows.push({
      configPath: field.configPath,
      label: getConfigFieldLabel(field.configPath),
      value: formatConfigFieldValue(getValue(field)),
    })
    bySection.set(field.section, rows)
  }

  return CONFIG_SECTIONS.filter((section) => bySection.has(section)).map((section) => ({
    section,
    sectionLabel: CONFIG_SECTION_LABELS[section],
    rows: bySection.get(section)!,
  }))
}

function formatConfigFieldValue(value: unknown): string {
  const normalizedValue = value

  if (normalizedValue === undefined || normalizedValue === null || normalizedValue === '') {
    return 'Not set'
  }
  if (Array.isArray(normalizedValue)) {
    return normalizedValue.length === 0
      ? 'Not set'
      : normalizedValue.map((item) => formatScalarValue(item)).join('\n')
  }

  return formatScalarValue(normalizedValue)
}

function createConfigurationDriftValueDiff(
  field: GitHubConfigDriftField
): ConfigurationDriftValueDiff {
  return {
    kind: 'scalar',
    dashboardValue: formatConfigFieldValue(field.dashboardValue),
    configValue: formatConfigFieldValue(field.githubValue),
  }
}

/**
 * Prefers the registry's hand-written label, and otherwise title-cases the last path segment —
 * never the whole path, which would leave the dots in.
 */
function getConfigFieldLabel(configPath: string): string {
  const label = getFieldDefinition(configPath)?.label
  return label ?? startCase(configPath.split('.').at(-1) ?? configPath)
}

function formatScalarValue(value: unknown): string {
  if (typeof value === 'string') return value || 'Not set'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  return JSON.stringify(value, null, 2) ?? 'Not set'
}
