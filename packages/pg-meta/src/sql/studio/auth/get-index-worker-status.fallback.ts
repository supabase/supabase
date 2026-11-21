/**
 * TEMPORARY. Delete once Spark (turso) has `pg_locks`, which `getIndexWorkerStatusSQL` reads.
 *
 * Spark has no advisory locks for an index worker to hold, so none is in progress.
 */

/** Fallback for `getIndexWorkerStatusSQL`. */
export const getIndexWorkerStatusFallback = async () => [{ is_in_progress: false }]
