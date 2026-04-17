import { literal, safeSql, type SafeSqlFragment } from '../../../pg-format'

export const getDatabaseSizeSql = (): SafeSqlFragment => {
  return safeSql`select sum(pg_database_size(pg_database.datname))::bigint as db_size from pg_database;`
}

export const getLiveTupleEstimate = (table: string, schema: string = 'public'): SafeSqlFragment => {
  return safeSql`
SELECT n_live_tup AS live_tuple_estimate
FROM pg_stat_user_tables
WHERE schemaname = ${literal(schema)}
AND relname = ${literal(table)};`
}

export const getMaxConnectionsSql = (): SafeSqlFragment => {
  return safeSql`show max_connections`
}

export const replicationLagSql = (): SafeSqlFragment => {
  return safeSql`
select
  case
    when (select count(*) from pg_stat_wal_receiver) = 1 and pg_last_wal_receive_lsn() = pg_last_wal_replay_lsn()
    then 0
    else coalesce(extract(epoch from now() - pg_last_xact_replay_timestamp()),0)
  end as physical_replica_lag_second
  `
}
