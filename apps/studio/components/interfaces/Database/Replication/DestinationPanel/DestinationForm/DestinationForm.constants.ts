// Hardcoded value for `s3AccessKeyId` field in the form to indicate creating a new key
export const CREATE_NEW_KEY = 'create-new'

// Hardcoded value for `namespace` field in the form to indicate creating a new namespace
export const CREATE_NEW_NAMESPACE = 'create-new-namespace'

export const STORED_SECRET_PLACEHOLDER = '••••••••••••••••'

// Default values for the pipeline's advanced settings, applied when the backend hasn't returned
// an explicit override. Shared between the form's default values and the field placeholders so
// both stay in sync. These mirror the `etl` Rust backend's own defaults (crates/etl-config/src/shared/{pipeline,destination}.rs) —
// keep them aligned if the backend defaults ever change.
export const DEFAULT_MAX_FILL_MS = 10000
export const DEFAULT_MAX_TABLE_SYNC_WORKERS = 4
export const DEFAULT_MAX_COPY_CONNECTIONS_PER_TABLE = 4
export const DEFAULT_CONNECTION_POOL_SIZE = 4
export const DEFAULT_DUCKLAKE_POOL_SIZE = 4
