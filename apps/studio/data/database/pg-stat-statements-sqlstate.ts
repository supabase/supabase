import { isUserFaultForSql } from '@/data/error-classification'

/**
 * For Studio SQL that runs statement text read from pg_stat_statements: almost any error is the
 * user's SQL. But pg_stat_statements replaces literals with $1, so "there is no parameter $1"
 * (42P02) is Studio's problem.
 */
export const isUserFaultForStatsStatement = (sqlState: string) =>
  sqlState !== '42P02' && isUserFaultForSql(sqlState)
