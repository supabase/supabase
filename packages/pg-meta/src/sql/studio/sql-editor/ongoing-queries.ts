export const getOngoingQueriesSql = () => {
  const sql = /* SQL */ `
select pid, query, query_start from pg_stat_activity where state = 'active' and datname = 'postgres';
`.trim()

  return sql
}
