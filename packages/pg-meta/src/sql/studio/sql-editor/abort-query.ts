export const getAbortQuerySQL = ({ pid }: { pid: number }) => {
  return `-- source: dashboard\n-- description: Terminate a running backend process by PID\nselect pg_terminate_backend(${pid})`.trim()
}
