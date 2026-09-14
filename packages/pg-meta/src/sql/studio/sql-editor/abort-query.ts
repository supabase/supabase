import { literal, safeSql, type SafeSqlFragment } from '../../../pg-format'

export const getCancelQuerySQL = ({
  pid,
  backendStart,
}: {
  pid: number
  backendStart?: string
}): SafeSqlFragment => {
  return safeSql`
select pg_cancel_backend(pid) as cancelled
from pg_stat_activity
where pid = ${literal(pid)}
${backendStart ? safeSql`and backend_start = ${literal(backendStart)}::timestamptz` : safeSql``}
`
}

export const getTerminateSessionSQL = ({
  pid,
  backendStart,
}: {
  pid: number
  backendStart?: string
}): SafeSqlFragment => {
  return safeSql`
select pg_terminate_backend(pid) as terminated
from pg_stat_activity
where pid = ${literal(pid)}
${backendStart ? safeSql`and backend_start = ${literal(backendStart)}::timestamptz` : safeSql``}
`
}
