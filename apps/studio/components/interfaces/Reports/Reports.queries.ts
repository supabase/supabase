import useDbQuery from 'hooks/analytics/useDbQuery'

type SearchQueryOpts = {
  searchQuery: string
  projectRef: string
}
export const useSearchReportsQuery = ({ searchQuery }: SearchQueryOpts) => {
  const sql = `-- Search by query
  -- A limit of 100 has been added below
  select
      auth.rolname,
      statements.query,
      statements.calls,
      -- -- Postgres 13, 14, 15
      statements.total_exec_time + statements.total_plan_time as total_time,
      statements.min_exec_time + statements.min_plan_time as min_time,
      statements.max_exec_time + statements.max_plan_time as max_time,
      statements.mean_exec_time + statements.mean_plan_time as mean_time,
      -- -- Postgres <= 12
      -- total_time,
      -- min_time,
      -- max_time,
      -- mean_time,
      statements.rows / statements.calls as avg_rows
    from pg_stat_statements as statements
      inner join pg_authid as auth on statements.userid = auth.oid
    where auth.rolname ~ '${searchQuery}' OR statements.query ~ '${searchQuery}'
    order by
      statements.calls desc
    limit 10;`

  return useDbQuery(sql)
}
