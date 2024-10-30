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
import { useIsLoggedIn } from 'common'

export function useLayoutNavCommands() {
  const isLoggedIn = useIsLoggedIn()

  useTableEditorGotoCommands({ enabled: isLoggedIn })
  useSqlEditorGotoCommands({ enabled: isLoggedIn })
  useDatabaseGotoCommands({ enabled: isLoggedIn })
  useAuthGotoCommands({ enabled: isLoggedIn })
  useAdvisorsGoToCommands({ enabled: isLoggedIn })
  useStorageGotoCommands({ enabled: isLoggedIn })
  useFunctionsGotoCommands({ enabled: isLoggedIn })
  useLogsGotoCommands({ enabled: isLoggedIn })
  useReportsGotoCommands({ enabled: isLoggedIn })
  useApiDocsGotoCommands({ enabled: isLoggedIn })
  useProjectSettingsGotoCommands({ enabled: isLoggedIn })
}
