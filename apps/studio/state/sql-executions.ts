import { proxy, useSnapshot } from 'valtio'

export type SqlExecution = {
  sql: string
  startedAt: number
  completedAt?: number
  duration?: number
  status: 'running' | 'completed' | 'error'
  error?: any
}

const sqlExecutionsState = proxy({
  executions: [] as SqlExecution[],
  addExecution(execution: SqlExecution) {
    this.executions.push(execution)
    return this.executions.length - 1
  },
  updateExecution(index: number, execution: SqlExecution) {
    this.executions[index] = execution
  },
  clearExecutions() {
    this.executions = []
  },
})

export const useSqlExecutions = () => {
  const snap = useSnapshot(sqlExecutionsState)
  return snap
}

export default sqlExecutionsState
