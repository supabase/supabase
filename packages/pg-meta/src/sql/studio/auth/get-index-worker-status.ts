// Checks pg_locks to determine if the index worker advisory lock is currently held

const INDEX_WORKER_ADVISORY_LOCK_KEY = 'auth_index_worker'

export const getIndexWorkerStatusSQL = () => {
  return `SELECT EXISTS (
    SELECT 1 FROM pg_locks
    WHERE locktype = 'advisory'
    AND (classid::bigint << 32 | objid::bigint) = hashtext('${INDEX_WORKER_ADVISORY_LOCK_KEY}')::bigint
  ) as is_in_progress;`
}
