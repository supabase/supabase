/**
 * Escape single quotes for SQL string literals.
 * In PostgreSQL, single quotes inside string literals must be doubled.
 * @example escapeSqlString("don't") // returns "don''t"
 */
export const escapeSqlString = (value: string): string => value.replaceAll("'", "''")
