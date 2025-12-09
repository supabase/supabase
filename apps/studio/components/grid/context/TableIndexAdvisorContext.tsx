import { createContext, useContext, PropsWithChildren, useState, useCallback } from 'react'

import { QueryIndexes } from 'components/interfaces/QueryPerformance/QueryIndexes'
import { useIndexAdvisorStatus } from 'components/interfaces/QueryPerformance/hooks/useIsIndexAdvisorStatus'
import {
  useTableIndexAdvisorQuery,
  TableIndexAdvisorData,
  IndexAdvisorSuggestion,
} from 'data/database/table-index-advisor-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from 'ui'

interface TableIndexAdvisorContextValue {
  isLoading: boolean
  isEnabled: boolean
  columnsWithSuggestions: string[]
  suggestions: TableIndexAdvisorData['suggestions']
  openSheet: (columnName: string) => void
  getSuggestionsForColumn: (columnName: string) => IndexAdvisorSuggestion[]
}

const TableIndexAdvisorContext = createContext<TableIndexAdvisorContextValue>({
  isLoading: false,
  isEnabled: false,
  columnsWithSuggestions: [],
  suggestions: [],
  openSheet: () => {},
  getSuggestionsForColumn: () => [],
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
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null)

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

  const openSheet = useCallback((columnName: string) => {
    setSelectedColumn(columnName)
    setIsSheetOpen(true)
  }, [])

  const closeSheet = useCallback(() => {
    setIsSheetOpen(false)
    setSelectedColumn(null)
  }, [])

  const getSuggestionsForColumn = useCallback(
    (columnName: string): IndexAdvisorSuggestion[] => {
      if (!data?.suggestions) return []
      // Filter suggestions that include this column in their index statements
      return data.suggestions.filter((suggestion) =>
        suggestion.index_statements.some((stmt) => {
          const match = stmt.match(/USING\s+\w+\s*\(([^)]+)\)/i)
          if (match) {
            const columns = match[1].split(',').map((c) => c.trim().replace(/^"(.+)"$/, '$1'))
            return columns.includes(columnName)
          }
          return false
        })
      )
    },
    [data?.suggestions]
  )

  // Get the first suggestion for the selected column to pass to QueryIndexes
  const selectedSuggestion = selectedColumn ? getSuggestionsForColumn(selectedColumn)[0] : null

  const value: TableIndexAdvisorContextValue = {
    isLoading,
    isEnabled: isIndexAdvisorEnabled,
    columnsWithSuggestions: data?.columnsWithSuggestions ?? [],
    suggestions: data?.suggestions ?? [],
    openSheet,
    getSuggestionsForColumn,
  }

  return (
    <TableIndexAdvisorContext.Provider value={value}>
      {children}
      <Sheet open={isSheetOpen} onOpenChange={(open) => !open && closeSheet()}>
        <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-[420px]">
          <SheetHeader className="border-b px-5 py-3">
            <SheetTitle>Index Recommendations</SheetTitle>
          </SheetHeader>
          {selectedSuggestion && (
            <QueryIndexes
              selectedRow={{ query: selectedSuggestion.query }}
              highlightContext={selectedColumn ? `column "${selectedColumn}"` : undefined}
            />
          )}
        </SheetContent>
      </Sheet>
    </TableIndexAdvisorContext.Provider>
  )
}

export function useTableIndexAdvisor() {
  return useContext(TableIndexAdvisorContext)
}

export function useColumnHasIndexSuggestion(columnName: string): boolean {
  const { columnsWithSuggestions } = useTableIndexAdvisor()
  return columnsWithSuggestions.includes(columnName)
}
