import { safeSql, type SafeSqlFragment } from '../../../pg-format'

export const getOngoingQueriesSql = (): SafeSqlFragment => {
  return safeSql`select pid, query, query_start from pg_stat_activity where state = 'active' and datname = 'postgres';`
}
