import { useApiDocsGoto } from 'components/interfaces/ProjectAPIDocs/ProjectAPIDocs.commands'
import { useAuthGoto } from './AuthLayout/AuthCommands'
import { useDatabaseGoto } from './DatabaseLayout/DatabaseCommands'
import { useFunctionsGoto } from './FunctionsLayout/FunctionsCommands'
import { useLogsGoto } from './LogsLayout/LogsCommands'
import { useReportsGoto } from './ReportsLayout/ReportsCommands'
import { useSqlEditorGoto } from './SQLEditorLayout/SQLEditorCommands'
import { useStorageGoto } from './StorageLayout/StorageCommands'
import { useTableEditorGoto } from './TableEditorLayout/TableEditorCommands'
import { useProjectSettingsGoto } from './ProjectSettingsLayout/ProjectSettingsCommands'

const useLayoutNavCommands = () => {
  useTableEditorGoto()
  useSqlEditorGoto()
  useDatabaseGoto()
  useAuthGoto()
  useStorageGoto()
  useFunctionsGoto()
  useLogsGoto()
  useReportsGoto()
  useApiDocsGoto()
  useProjectSettingsGoto()
}

export { useLayoutNavCommands }
