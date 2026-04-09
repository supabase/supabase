export const getAbortQuerySQL = ({ pid }: { pid: number }) => {
  return `select pg_terminate_backend(${pid})`.trim()
}
