import { useFlag, useIsLoggedIn } from 'common'

import { useStorageGotoCommands } from '../interfaces/Storage/Storage.Commands'
import { useAdvisorsGoToCommands } from './AdvisorsLayout/Advisors.Commands'
import { useAuthGotoCommands } from './AuthLayout/Auth.Commands'
import { useBillingGotoCommands } from './BillingLayout/Billing.Commands'
import { useComputeGotoCommands } from './ComputeLayout/Compute.Commands'
import { useDatabaseGotoCommands } from './DatabaseLayout/Database.Commands'
import { useFunctionsGotoCommands } from './EdgeFunctionsLayout/EdgeFunctions.Commands'
import { useIntegrationsGotoCommands } from './IntegrationsLayout/Integrations.Commands'
import { useLogsGotoCommands } from './LogsLayout/Logs.Commands'
import { useProjectSettingsGotoCommands } from './ProjectSettingsLayout/ProjectSettings.Commands'
import { useReportsGotoCommands } from './ReportsLayout/Reports.Commands'
import { useSqlEditorGotoCommands } from './SQLEditorLayout/SqlEditor.Commands'
import { useTableEditorGotoCommands } from './TableEditorLayout/TableEditor.Commands'
import { useApiDocsGotoCommands } from '@/components/interfaces/ProjectAPIDocs/ProjectAPIDocs.Commands'

export function useLayoutNavCommands() {
  const isLoggedIn = useIsLoggedIn()
  const computeEnabled = useFlag('compute')

  useTableEditorGotoCommands({ enabled: isLoggedIn })
  useSqlEditorGotoCommands({ enabled: isLoggedIn })
  useDatabaseGotoCommands({ enabled: isLoggedIn })
  useAuthGotoCommands({ enabled: isLoggedIn })
  useAdvisorsGoToCommands({ enabled: isLoggedIn })
  useStorageGotoCommands({ enabled: isLoggedIn })
  useFunctionsGotoCommands({ enabled: isLoggedIn })
  useComputeGotoCommands({ enabled: isLoggedIn && computeEnabled })
  useLogsGotoCommands({ enabled: isLoggedIn })
  useReportsGotoCommands({ enabled: isLoggedIn })
  useApiDocsGotoCommands({ enabled: isLoggedIn })
  useProjectSettingsGotoCommands({ enabled: isLoggedIn })
  useIntegrationsGotoCommands({ enabled: isLoggedIn })
  useBillingGotoCommands({ enabled: isLoggedIn })
}
