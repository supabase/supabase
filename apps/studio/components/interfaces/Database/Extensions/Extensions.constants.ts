export const HIDDEN_EXTENSIONS = [
  'adminpack',
  'amcheck',
  'file_fdw',
  'lo',
  'old_snapshot',
  'pageinspect',
  'pg_buffercache',
  'pg_freespacemap',
  'pg_surgery',
  'pg_visibility',
  'supabase_vault',
  'supautils',
  'intagg',
  'xml2',
  'pg_tle',
  'pg_stat_monitor',
]

export const SEARCH_TERMS: Record<string, string[]> = {
  vector: ['pgvector', 'pg_vector'],
}

export const EXTENSION_DISABLE_WARNINGS: Record<string, string> = {
  pg_cron: 'Disabling this extension will delete all scheduled jobs. This cannot be undone.',
}

// Extensions that have recommended schemas (rather than required schemas)
export const extensionsWithRecommendedSchemas: Record<string, string> = {
  wrappers: 'extensions',
}
