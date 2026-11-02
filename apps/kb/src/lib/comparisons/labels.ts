import type {
  ExportFormat,
  LicenseTier,
  OpenSourceScope,
  QueryModel,
  SelfHostLevel,
  WireProtocol,
} from './types'

// Typed as Record so adding an enum value to types.ts fails to compile until it has a label.

export const UNKNOWN_LABEL = 'Unknown'
export const NONE_LABEL = 'None'

export const LICENSE_LABELS: Record<LicenseTier, string> = {
  osi_open_source: 'Open source (OSI)',
  fair_source: 'Fair source',
  source_available: 'Source available',
  closed: 'Closed',
}

export const OPEN_SOURCE_SCOPE_LABELS: Record<OpenSourceScope, string> = {
  database_engine: 'Database engine',
  storage_engine: 'Storage engine',
  backend_services: 'Backend services',
  client_sdks: 'Client SDKs',
  dashboard: 'Dashboard',
  control_plane: 'Control plane',
}

export const SELF_HOST_LABELS: Record<SelfHostLevel, string> = {
  none: 'No self-host',
  community_only: 'Community only',
  official_guide: 'Official guide',
  official_docker: 'Official (Docker)',
  official_kubernetes: 'Official (Kubernetes)',
  on_prem_air_gapped: 'On-prem or air-gapped',
}

export const WIRE_PROTOCOL_LABELS: Record<WireProtocol, string> = {
  postgres: 'Postgres',
  mysql: 'MySQL',
  proprietary: 'Proprietary',
}

export const QUERY_MODEL_LABELS: Record<QueryModel, string> = {
  sql: 'SQL',
  document: 'Document',
}

export const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  pg_dump: 'pg_dump',
  mysql_sql: 'MySQL SQL',
  jsonl: 'JSON Lines',
  csv: 'CSV',
  leveldb: 'LevelDB',
  zip: 'Zip archive',
}
