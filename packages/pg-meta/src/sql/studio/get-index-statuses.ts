import { literal } from '../../pg-format'
import { USER_SEARCH_INDEXES } from 'common/constants/user-search-indexes'

export const getIndexStatusesSQL = () => {
  return `SELECT c.relname as index_name, i.indisvalid as is_valid, i.indisready as is_ready
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'auth'
    AND c.relname IN (${USER_SEARCH_INDEXES.map(literal).join(', ')});`
}
