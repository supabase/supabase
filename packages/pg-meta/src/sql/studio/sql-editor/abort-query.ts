import { literal, safeSql, type SafeSqlFragment } from '../../../pg-format'

/**
 * When backendStart is provided, the cancel only fires if that pid still belongs to the
 * same backend (OS pids get recycled, so a stale pid could otherwise match a new, unrelated session).
 * Returns zero rows if the pid is gone or has been reused by a different backend.
 */
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

/**
 * When backendStart is provided, the terminate only fires if that pid still belongs to the
 * same backend (OS pids get recycled, so a stale pid could otherwise match a new, unrelated session).
 * Returns zero rows if the pid is gone or has been reused by a different backend.
 */
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
