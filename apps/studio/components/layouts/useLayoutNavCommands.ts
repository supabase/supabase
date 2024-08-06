import { useApiDocsGotoCommands } from 'components/interfaces/ProjectAPIDocs/ProjectAPIDocs.Commands'
import { useAdvisorsGoToCommands } from './AdvisorsLayout/Advisors.Commands'
import { useAuthGotoCommands } from './AuthLayout/Auth.Commands'
import { useDatabaseGotoCommands } from './DatabaseLayout/Database.Commands'
import { useFunctionsGotoCommands } from './FunctionsLayout/Functions.Commands'
import { useLogsGotoCommands } from './LogsLayout/Logs.Commands'
import { useProjectSettingsGotoCommands } from './ProjectSettingsLayout/ProjectSettings.Commands'
import { useReportsGotoCommands } from './ReportsLayout/Reports.Commands'
import { useStorageGotoCommands } from './StorageLayout/Storage.Commands'
import { useSqlEditorGotoCommands } from './SQLEditorLayout/SqlEditor.Commands'
import { useTableEditorGotoCommands } from './TableEditorLayout/TableEditor.Commands'

export function useLayoutNavCommands() {
  useTableEditorGotoCommands()
  useSqlEditorGotoCommands()
  useDatabaseGotoCommands()
  useAuthGotoCommands()
  useAdvisorsGoToCommands()
  useStorageGotoCommands()
  useFunctionsGotoCommands()
  useLogsGotoCommands()
  useReportsGotoCommands()
  useApiDocsGotoCommands()
  useProjectSettingsGotoCommands()
}
