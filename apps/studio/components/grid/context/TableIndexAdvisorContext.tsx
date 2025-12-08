import { createContext, useContext, PropsWithChildren } from 'react'

import { useIndexAdvisorStatus } from 'components/interfaces/QueryPerformance/hooks/useIsIndexAdvisorStatus'
import {
  useTableIndexAdvisorQuery,
  TableIndexAdvisorData,
} from 'data/database/table-index-advisor-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'

interface TableIndexAdvisorContextValue {
  isLoading: boolean
  isEnabled: boolean
  columnsWithSuggestions: string[]
  suggestions: TableIndexAdvisorData['suggestions']
}

const TableIndexAdvisorContext = createContext<TableIndexAdvisorContextValue>({
  isLoading: false,
  isEnabled: false,
  columnsWithSuggestions: [],
  suggestions: [],
})

interface TableIndexAdvisorProviderProps {
  schema: string
  table: string
}

export function TableIndexAdvisorProvider({
  children,
  schema,
  table,
}: PropsWithChildren<TableIndexAdvisorProviderProps>) {
  const { data: project } = useSelectedProjectQuery()
  const { isIndexAdvisorEnabled } = useIndexAdvisorStatus()

  const { data, isLoading } = useTableIndexAdvisorQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      schema,
      table,
    },
    {
      enabled: isIndexAdvisorEnabled && !!schema && !!table,
    }
  )

  const value: TableIndexAdvisorContextValue = {
    isLoading,
    isEnabled: isIndexAdvisorEnabled,
    columnsWithSuggestions: data?.columnsWithSuggestions ?? [],
    suggestions: data?.suggestions ?? [],
  }

  return (
    <TableIndexAdvisorContext.Provider value={value}>{children}</TableIndexAdvisorContext.Provider>
  )
}

export function useTableIndexAdvisor() {
  return useContext(TableIndexAdvisorContext)
}

export function useColumnHasIndexSuggestion(columnName: string): boolean {
  const { columnsWithSuggestions } = useTableIndexAdvisor()
  return columnsWithSuggestions.includes(columnName)
}
