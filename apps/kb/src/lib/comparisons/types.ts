// Schema for competitor deployment and portability profiles. Each file in this
// directory exports one profile that conforms to CompetitorProfile, so the
// comparison data stays uniform across competitors.
//
// Every characteristic carries its own `sourcing_urls` so a reviewer can check
// each claim independently. Do not fill in a value from memory.
//
// `value` has three meanings, and they must stay distinct:
// - `null`: not verified yet. Render as "Unknown".
// - `false`: verified as not offered. Render as "No".
// - `true` or a concrete value: verified against a source in `sourcing_urls`.
//
// Do not set `false` just because a public page is silent. Use `null` until a
// source confirms the absence.

export interface Characteristic<T> {
  /** `null` until the claim is verified against a source. */
  value: T | null
  /** Caveats or the scope the value applies to. */
  notes?: string
  /** URLs that support `value`. Empty when `value` is `null`. */
  sourcing_urls: string[]
}

export type LicenseTier = 'osi_open_source' | 'fair_source' | 'source_available' | 'closed'

export type OpenSourceScope =
  | 'database_engine'
  | 'storage_engine'
  | 'backend_services'
  | 'client_sdks'
  | 'dashboard'
  | 'control_plane'

// Roughly ordered by level of official support. Each level is a separate claim,
// so "code exists but no supported path" is not the same as "official Docker setup".
export type SelfHostLevel =
  | 'none'
  | 'community_only'
  | 'official_guide'
  | 'official_docker'
  | 'official_kubernetes'
  | 'on_prem_air_gapped'

export type WireProtocol = 'postgres' | 'mysql' | 'proprietary'

// `document` covers NoSQL stores accessed through a vendor SDK or API. The
// wire_protocol field already records whether that access is proprietary.
export type QueryModel = 'sql' | 'document'

// Format of a data export. `zip` means a zip archive whose contents aren't documented.
export type ExportFormat = 'pg_dump' | 'mysql_sql' | 'jsonl' | 'csv' | 'leveldb' | 'zip'

export interface UpstreamProject {
  name: string
  /** SPDX license identifier, such as `Apache-2.0` or `PostgreSQL`. */
  license: string
  /** CNCF maturity level, or `null` if the project is not a CNCF project. */
  cncf_status: string | null
}

export interface CompetitorProfile {
  name: string
  /** ISO date (YYYY-MM-DD) of the most recent source check. */
  last_verified: string
  deployment: {
    license: Characteristic<{ tier: LicenseTier; spdx_id: string | null }>
    open_source_scope: Characteristic<OpenSourceScope[]>
    self_host: Characteristic<SelfHostLevel>
  }
  portability: {
    /** Every protocol the product accepts. Multi-product vendors list each one. */
    wire_protocol: Characteristic<WireProtocol[]>
    query_model: Characteristic<QueryModel>
    /** Open-source or standards projects the product is built on. */
    upstream_projects: Characteristic<UpstreamProject[]>
    /** Command or console action that exports the data. */
    export_tool: Characteristic<string>
    export_format: Characteristic<ExportFormat>
    /** Whether a standard Postgres or MySQL server can load the export without conversion. */
    loads_into_standard_server: Characteristic<boolean>
  }
}
