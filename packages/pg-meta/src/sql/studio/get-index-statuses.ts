import { literal } from '../../pg-format'

export const USER_SEARCH_INDEXES = [
  'idx_users_email',
  'idx_users_email_trgm',
  'idx_users_created_at_desc',
  'idx_users_last_sign_in_at_desc',
  'idx_users_name_trgm',
  // this index is not created by the indexworker but is required for efficient queries
  // it is already created as part of the `UNIQUE` constraint on the `phone` column
  'users_phone_key',
]

export const getIndexStatusesSQL = () => {
  return `SELECT c.relname as index_name, i.indisvalid as is_valid, i.indisready as is_ready
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'auth'
    AND c.relname IN (${USER_SEARCH_INDEXES.map(literal).join(', ')});`
}
