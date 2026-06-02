import { createContext, PropsWithChildren, useCallback, useContext } from 'react'
import { proxy, snapshot, useSnapshot } from 'valtio'

import type { DatePickerValue } from '@/components/interfaces/Settings/Logs/Logs.DatePickers'
import { getLogDatePickerValueForHelper } from '@/components/interfaces/Settings/Logs/logsDateRange'

export type QueryExecutionSource = 'database' | 'logs'

export function createQueryExecutionSourceState() {
  const state = proxy({
    executionSource: 'database' as QueryExecutionSource,
    logsDatePickerValue: getLogDatePickerValueForHelper() as DatePickerValue,
    useOtelEndpoint: false,
    setExecutionSource: (source: QueryExecutionSource) => {
      state.executionSource = source
    },
    setLogsDatePickerValue: (value: DatePickerValue) => {
      state.logsDatePickerValue = value
    },
    setUseOtelEndpoint: (value: boolean) => {
      state.useOtelEndpoint = value
    },
  })

  return state
}

export type QueryExecutionSourceState = ReturnType<typeof createQueryExecutionSourceState>

export const queryExecutionSourceState = createQueryExecutionSourceState()

export const QueryExecutionSourceStateContext =
  createContext<QueryExecutionSourceState>(queryExecutionSourceState)

export const QueryExecutionSourceStateContextProvider = ({ children }: PropsWithChildren) => {
  return (
    <QueryExecutionSourceStateContext.Provider value={queryExecutionSourceState}>
      {children}
    </QueryExecutionSourceStateContext.Provider>
  )
}

export function useQueryExecutionSourceSnapshot(options?: Parameters<typeof useSnapshot>[1]) {
  const state = useContext(QueryExecutionSourceStateContext)
  return useSnapshot(state, options)
}

export function useGetQueryExecutionSource() {
  const state = useContext(QueryExecutionSourceStateContext)
  return useCallback(() => snapshot(state).executionSource, [state])
}
