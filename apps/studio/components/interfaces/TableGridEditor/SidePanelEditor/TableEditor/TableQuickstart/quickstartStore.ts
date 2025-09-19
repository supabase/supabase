import { proxy, useSnapshot } from 'valtio'
import type { TableSuggestion } from './types'

type QuickstartStore = {
  selectedTableData: {
    tableName: string
    fields: TableSuggestion['fields']
    rationale?: string
  } | null
  isQuickstartFlow: boolean
  setQuickstartData: (table: TableSuggestion | null) => void
  clearQuickstartData: () => void
  startQuickstartFlow: () => void
  endQuickstartFlow: () => void
}

const quickstartStore = proxy<QuickstartStore>({
  selectedTableData: null,
  isQuickstartFlow: false,

  setQuickstartData: (table) => {
    if (table) {
      quickstartStore.selectedTableData = {
        tableName: table.tableName,
        fields: table.fields,
        rationale: table.rationale,
      }
      quickstartStore.isQuickstartFlow = true
    } else {
      quickstartStore.selectedTableData = null
    }
  },

  clearQuickstartData: () => {
    quickstartStore.selectedTableData = null
    quickstartStore.isQuickstartFlow = false
  },

  startQuickstartFlow: () => {
    quickstartStore.isQuickstartFlow = true
  },

  endQuickstartFlow: () => {
    quickstartStore.isQuickstartFlow = false
  },
})

export const useQuickstartStore = () => {
  return quickstartStore
}

export const useQuickstartSnapshot = () => {
  return useSnapshot(quickstartStore)
}

export const getQuickstartStore = () => quickstartStore
