// Hardcoded value for `s3AccessKeyId` field in the form to indicate creating a new key
export const CREATE_NEW_KEY = 'create-new'

// Hardcoded value for `namespace` field in the form to indicate creating a new namespace
export const CREATE_NEW_NAMESPACE = 'create-new-namespace'

// DuckLake can either be backed by Supabase projects (catalog + storage are managed for the
// user) or configured manually with a PostgreSQL catalog URL and S3-compatible credentials.
export const DUCKLAKE_MODE_SUPABASE = 'supabase'
export const DUCKLAKE_MODE_CUSTOM = 'custom'
export type DucklakeMode = typeof DUCKLAKE_MODE_SUPABASE | typeof DUCKLAKE_MODE_CUSTOM
