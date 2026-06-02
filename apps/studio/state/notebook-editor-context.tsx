import { createContext, PropsWithChildren, useContext } from 'react'

import type { DatePickerValue } from '@/components/interfaces/Settings/Logs/Logs.DatePickers'
import type { ChartConfig } from '@/components/interfaces/SQLEditor/UtilityPanel/ChartConfig'
import type { NotebookBlockPersistPatch } from '@/state/notebook-block-registry'

export interface NotebookEditorContextValue {
  notebookId: string
  blockId: string
  chartConfig: ChartConfig
  onChartConfigChange: (config: ChartConfig) => void
  persistBlock: (patch: NotebookBlockPersistPatch) => void
  querySource: 'database' | 'logs'
  logsDatePickerValue: DatePickerValue
}

const NotebookEditorContext = createContext<NotebookEditorContextValue | null>(null)

export const NotebookEditorProvider = ({
  value,
  children,
}: PropsWithChildren<{ value: NotebookEditorContextValue }>) => (
  <NotebookEditorContext.Provider value={value}>{children}</NotebookEditorContext.Provider>
)

export const useNotebookEditorContext = () => useContext(NotebookEditorContext)

/** @deprecated Use NotebookEditorProvider / useNotebookEditorContext */
export type ReportEditorContextValue = NotebookEditorContextValue

/** @deprecated Use NotebookEditorProvider */
export const ReportEditorProvider = NotebookEditorProvider

/** @deprecated Use useNotebookEditorContext */
export const useReportEditorContext = useNotebookEditorContext
