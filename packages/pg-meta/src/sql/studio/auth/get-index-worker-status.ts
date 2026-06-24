import { literal, safeSql, type SafeSqlFragment } from '../../../pg-format'

// Checks pg_locks to determine if the index worker advisory lock is currently held

const INDEX_WORKER_ADVISORY_LOCK_KEY = 'auth_index_worker'

export const getIndexWorkerStatusSQL = (): SafeSqlFragment => {
  return safeSql`SELECT EXISTS (
    SELECT 1 FROM pg_locks
    WHERE locktype = 'advisory'
    AND (classid::bigint << 32 | objid::bigint) = hashtext(${literal(INDEX_WORKER_ADVISORY_LOCK_KEY)})::bigint
  ) as is_in_progress;`
}
