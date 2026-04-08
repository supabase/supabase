import { literal } from '../../../pg-format'

export const getDatabaseSizeSql = () => {
  const sql = /* SQL */ `
-- source: dashboard
-- description: Fetch total size of all databases in bytes
select sum(pg_database_size(pg_database.datname))::bigint as db_size from pg_database;
`.trim()

  return sql
}

export const getLiveTupleEstimate = (table: string, schema: string = 'public') => {
  const sql = /* SQL */ `
-- source: dashboard
-- description: Fetch live tuple estimate for a specific table from pg_stat_user_tables
SELECT n_live_tup AS live_tuple_estimate
FROM pg_stat_user_tables
WHERE schemaname = ${literal(schema)}
AND relname = ${literal(table)};
`.trim()

  return sql
}

export const getMaxConnectionsSql = () => {
  const sql = /* SQL */ `-- source: dashboard\n-- description: Fetch the maximum number of allowed database connections\nshow max_connections`

  return sql
}

export const replicationLagSql = () => {
  const sql = /* SQL */ `
-- source: dashboard
-- description: Fetch physical replication lag in seconds from the replica's last replayed transaction
select
  case
    when (select count(*) from pg_stat_wal_receiver) = 1 and pg_last_wal_receive_lsn() = pg_last_wal_replay_lsn()
    then 0
    else coalesce(extract(epoch from now() - pg_last_xact_replay_timestamp()),0)
  end as physical_replica_lag_second
  `

  return sql
}
