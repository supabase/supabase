/**
 * TEMPORARY. Delete once Spark (turso) has `pg_get_keywords`, which `getKeywordsSql` reads.
 *
 * No keyword list without it: the SQL editor still completes tables, columns and functions.
 */

/** Fallback for `getKeywordsSql`. */
export const getKeywordsFallback = async (): Promise<{ word: string }[]> => []
