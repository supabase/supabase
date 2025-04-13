export const genChartQuery = (
  table: LogsTableName,
  params: LogsEndpointParams,
  filters: Filters
) => {
  const [startOffset, trunc] = calcChartStart(params)
  let where = genWhereStatement(table, filters)
  const errorCondition = getErrorCondition(table)
  const warningCondition = getWarningCondition(table)

  // pg_cron logs are a subset of postgres logs
  // to calculate the chart, we need to query postgres logs
  if (table === LogsTableName.PG_CRON) {
    table = LogsTableName.POSTGRES
    where = `where (parsed.application_name = 'pg_cron' OR event_message LIKE '%cron job%')`
  }

  let joins = genCrossJoinUnnests(table)

  const q = `
SELECT
-- log-event-chart
  timestamp_trunc(t.timestamp, ${trunc}) as timestamp,
  count(CASE WHEN NOT (${errorCondition} OR ${warningCondition}) THEN 1 END) as ok_count,
  count(CASE WHEN ${errorCondition} THEN 1 END) as error_count,
  count(CASE WHEN ${warningCondition} THEN 1 END) as warning_count
FROM
  ${table} t
  ${joins}
  ${
    where
      ? where + ` and t.timestamp > '${startOffset.toISOString()}'`
      : `where t.timestamp > '${startOffset.toISOString()}'`
  }
GROUP BY
timestamp
ORDER BY
  timestamp ASC
  `
  return q
}

export const unifiedLogsQuery = (
  table: LogsTableName,
  params: LogsEndpointParams,
  filters: Filters,
  limit: number
) => {
  const [startOffset, trunc] = calcChartStart(params)
  let where = genWhereStatement(table, filters)
  let joins = genCrossJoinUnnests(table)

  // pg_cron logs are a subset of postgres logs
  // to calculate the chart, we need to query postgres logs
  if (table === LogsTableName.PG_CRON) {
    table = LogsTableName.POSTGRES
    where = `where (parsed.application_name = 'pg_cron' OR event_message LIKE '%cron job%')`
  }

  return `
select 
  id,
  timestamp,
  event_message,
  request.method,
  request.path,
  response.status_code
from (
  select
    id,
    timestamp,
    event_message,
    metadata
  from edge_logs
  cross join unnest(metadata) as m
  cross join unnest(m.request) as request
  cross join unnest(m.response) as response
  ${where}
  union all
  select
    id,
    timestamp,
    event_message,
    metadata
  from postgres_logs
  ${where}
) as unified_logs
order by timestamp desc
limit ${limit}
`
}
