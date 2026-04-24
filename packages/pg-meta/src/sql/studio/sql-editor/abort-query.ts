import { literal, safeSql, type SafeSqlFragment } from '../../../pg-format'

export const getAbortQuerySQL = ({ pid }: { pid: number }): SafeSqlFragment => {
  return safeSql`select pg_terminate_backend(${literal(pid)})`
}
