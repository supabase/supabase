import { literal, safeSql, type SafeSqlFragment } from '../../../pg-format'

export const getCancelQuerySQL = ({ pid }: { pid: number }): SafeSqlFragment => {
  return safeSql`select pg_cancel_backend(${literal(pid)})`
}

export const getTerminateSessionSQL = ({ pid }: { pid: number }): SafeSqlFragment => {
  return safeSql`select pg_terminate_backend(${literal(pid)})`
}
