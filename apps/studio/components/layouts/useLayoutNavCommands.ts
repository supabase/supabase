import { useIsLoggedIn } from 'common'
import { useApiDocsGotoCommands } from 'components/interfaces/ProjectAPIDocs/ProjectAPIDocs.Commands'
import { useAdvisorsGoToCommands } from './AdvisorsLayout/Advisors.Commands'
import { useAuthGotoCommands } from './AuthLayout/Auth.Commands'
import { useBillingGotoCommands } from './BillingLayout/Billing.Commands'
import { useDatabaseGotoCommands } from './DatabaseLayout/Database.Commands'
import { useFunctionsGotoCommands } from './EdgeFunctionsLayout/EdgeFunctions.Commands'
import { useIntegrationsGotoCommands } from './IntegrationsLayout/Integrations.Commands'
import { useLogsGotoCommands } from './LogsLayout/Logs.Commands'
import { useProjectSettingsGotoCommands } from './ProjectSettingsLayout/ProjectSettings.Commands'
import { useReportsGotoCommands } from './ReportsLayout/Reports.Commands'
import { useSqlEditorGotoCommands } from './SQLEditorLayout/SqlEditor.Commands'
import { useStorageGotoCommands } from '../interfaces/Storage/Storage.Commands'
import { useTableEditorGotoCommands } from './TableEditorLayout/TableEditor.Commands'

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
  useIntegrationsGotoCommands({ enabled: isLoggedIn })
  useBillingGotoCommands({ enabled: isLoggedIn })
}
