import {
  EXPORT_FORMAT_LABELS,
  LICENSE_LABELS,
  NONE_LABEL,
  OPEN_SOURCE_SCOPE_LABELS,
  QUERY_MODEL_LABELS,
  SELF_HOST_LABELS,
  UNKNOWN_LABEL,
  WIRE_PROTOCOL_LABELS,
} from './labels'
import type { Characteristic, CompetitorProfile } from './types'

export type RowKey =
  | 'license'
  | 'open_source_scope'
  | 'self_host'
  | 'wire_protocol'
  | 'query_model'
  | 'upstream_projects'
  | 'export_format'
  | 'loads_into_standard_server'

export interface CellResult {
  text: string
  /** Footnote number, present when the characteristic has notes. */
  footnote?: number
}

export interface Footnote {
  number: number
  notes: string
  sourcing_urls: string[]
}

export interface ComparisonTable {
  profileNames: string[]
  rows: { label: string; cells: CellResult[] }[]
  footnotes: Footnote[]
}

interface Row {
  key: RowKey
  label: string
  cell: (profile: CompetitorProfile) => { text: string; notes?: string; sourcing_urls: string[] }
}

// Turns one characteristic into display text. `null` means not verified, so it
// renders as "Unknown" and never as "No".
const row = <T>(
  key: RowKey,
  label: string,
  characteristic: (profile: CompetitorProfile) => Characteristic<T>,
  format: (value: T) => string
): Row => ({
  key,
  label,
  cell: (profile) => {
    const c = characteristic(profile)
    const text = c.value === null ? UNKNOWN_LABEL : format(c.value)
    return { text, notes: c.notes, sourcing_urls: c.sourcing_urls }
  },
})

const ROWS: Row[] = [
  row(
    'license',
    'License',
    (p) => p.deployment.license,
    ({ tier, spdx_id }) => (spdx_id ? `${LICENSE_LABELS[tier]} (${spdx_id})` : LICENSE_LABELS[tier])
  ),
  row(
    'open_source_scope',
    'Open-source scope',
    (p) => p.deployment.open_source_scope,
    (scopes) =>
      scopes.length === 0 ? NONE_LABEL : scopes.map((s) => OPEN_SOURCE_SCOPE_LABELS[s]).join(', ')
  ),
  row(
    'self_host',
    'Self-host',
    (p) => p.deployment.self_host,
    (level) => SELF_HOST_LABELS[level]
  ),
  row(
    'wire_protocol',
    'Wire protocol',
    (p) => p.portability.wire_protocol,
    (protocols) => protocols.map((p) => WIRE_PROTOCOL_LABELS[p]).join(', ')
  ),
  row(
    'query_model',
    'Query model',
    (p) => p.portability.query_model,
    (model) => QUERY_MODEL_LABELS[model]
  ),
  row(
    'upstream_projects',
    'Upstream projects',
    (p) => p.portability.upstream_projects,
    (projects) =>
      projects.length === 0
        ? NONE_LABEL
        : projects
            .map((u) => `${u.name} (${u.license})${u.cncf_status ? `, CNCF ${u.cncf_status}` : ''}`)
            .join('; ')
  ),
  row(
    'export_format',
    'Export format',
    (p) => p.portability.export_format,
    (format) => EXPORT_FORMAT_LABELS[format]
  ),
  row(
    'loads_into_standard_server',
    'Loads into a standard server',
    (p) => p.portability.loads_into_standard_server,
    (loads) => (loads ? 'Yes' : 'No')
  ),
]

export const ALL_ROW_KEYS: RowKey[] = ROWS.map((r) => r.key)

// Builds the table model. Rows appear in the order given by `rowKeys`. Footnotes
// are numbered in reading order, so a cell with notes gets a number and its note
// is listed below the table with sources.
export const buildComparisonTable = (
  profiles: CompetitorProfile[],
  rowKeys: RowKey[] = ALL_ROW_KEYS
): ComparisonTable => {
  const footnotes: Footnote[] = []

  const rows = rowKeys.map((key) => {
    const r = ROWS.find((candidate) => candidate.key === key)!
    return {
      label: r.label,
      cells: profiles.map((profile): CellResult => {
        const { text, notes, sourcing_urls } = r.cell(profile)
        if (!notes) return { text }
        const number = footnotes.length + 1
        footnotes.push({ number, notes, sourcing_urls })
        return { text, footnote: number }
      }),
    }
  })

  return {
    profileNames: profiles.map((p) => p.name),
    rows,
    footnotes,
  }
}
