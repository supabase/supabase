import { proxy, useSnapshot } from 'valtio'
import { QueryKey } from '@tanstack/react-query'

export type SqlExecution = {
  queryKey?: QueryKey
  sql: string
  startedAt: number
  completedAt?: number
  duration?: number
  status: 'running' | 'completed' | 'error'
  error?: any
  url?: string
}

const sqlExecutionsState = proxy({
  executions: [] as SqlExecution[],
  addExecution(execution: SqlExecution) {
    const existingExecution = this.executions.find(
      (e) =>
        e.queryKey !== undefined &&
        execution.queryKey !== undefined &&
        e.queryKey.join('-') === execution.queryKey.join('-') &&
        e.status === 'running'
    )

    if (existingExecution) {
      return this.executions.findIndex(
        (e) =>
          e.queryKey !== undefined &&
          execution.queryKey !== undefined &&
          e.queryKey.join('-') === execution.queryKey.join('-')
      )
    }

    this.executions.push(execution)
    if (this.executions.length > 50) {
      this.executions.shift()
    }
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
