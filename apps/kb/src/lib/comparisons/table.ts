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

export interface CellResult {
  text: string
  /** Footnote number, present when the characteristic has a footnote. */
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
  label: string
  cell: (profile: CompetitorProfile) => { text: string; footnote?: string; sourcing_urls: string[] }
}

// Turns one characteristic into display text. `null` means not verified, so it
// renders as "Unknown" and never as "No".
const row = <T>(
  label: string,
  characteristic: (profile: CompetitorProfile) => Characteristic<T>,
  format: (value: T) => string
): Row => ({
  label,
  cell: (profile) => {
    const c = characteristic(profile)
    const text = c.value === null ? UNKNOWN_LABEL : format(c.value)
    return { text, footnote: c.footnote, sourcing_urls: c.sourcing_urls }
  },
})

// The single place a row is defined. Its key is the object key, so `RowKey`,
// the default row list, and the generator's row choices all follow from here.
const ROW_DEFINITIONS = {
  license: row(
    'License',
    (p) => p.deployment.license,
    ({ tier, spdx_id }) => (spdx_id ? `${LICENSE_LABELS[tier]} (${spdx_id})` : LICENSE_LABELS[tier])
  ),
  open_source_scope: row(
    'Open-source scope',
    (p) => p.deployment.open_source_scope,
    (scopes) =>
      scopes.length === 0 ? NONE_LABEL : scopes.map((s) => OPEN_SOURCE_SCOPE_LABELS[s]).join(', ')
  ),
  self_host: row(
    'Self-host',
    (p) => p.deployment.self_host,
    (level) => SELF_HOST_LABELS[level]
  ),
  wire_protocol: row(
    'Wire protocol',
    (p) => p.portability.wire_protocol,
    (protocols) => protocols.map((p) => WIRE_PROTOCOL_LABELS[p]).join(', ')
  ),
  query_model: row(
    'Query model',
    (p) => p.portability.query_model,
    (model) => QUERY_MODEL_LABELS[model]
  ),
  upstream_projects: row(
    'Upstream projects',
    (p) => p.portability.upstream_projects,
    (projects) =>
      projects.length === 0
        ? NONE_LABEL
        : projects
            .map((u) => `${u.name} (${u.license})${u.cncf_status ? `, CNCF ${u.cncf_status}` : ''}`)
            .join('; ')
  ),
  export_format: row(
    'Export format',
    (p) => p.portability.export_format,
    (format) => EXPORT_FORMAT_LABELS[format]
  ),
  loads_into_standard_server: row(
    'Loads into a standard server',
    (p) => p.portability.loads_into_standard_server,
    (loads) => (loads ? 'Yes' : 'No')
  ),
} satisfies Record<string, Row>

export type RowKey = keyof typeof ROW_DEFINITIONS

// Object keys keep insertion order, so this is the order of the rows as defined above.
export const ALL_ROW_KEYS = Object.keys(ROW_DEFINITIONS) as RowKey[]

// Builds the table model. Rows appear in the order given by `rowKeys`. Footnotes
// are numbered in reading order, so a cell with a footnote gets a number and its
// text is listed below the table with sources.
export const buildComparisonTable = (
  profiles: CompetitorProfile[],
  rowKeys: RowKey[] = ALL_ROW_KEYS
): ComparisonTable => {
  const footnotes: Footnote[] = []

  const rows = rowKeys.map((key) => {
    const r = ROW_DEFINITIONS[key]
    return {
      label: r.label,
      cells: profiles.map((profile): CellResult => {
        const { text, footnote, sourcing_urls } = r.cell(profile)
        if (!footnote) return { text }
        const number = footnotes.length + 1
        footnotes.push({ number, notes: footnote, sourcing_urls })
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
