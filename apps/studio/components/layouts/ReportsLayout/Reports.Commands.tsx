import { useMemo } from 'react'

import { useParams } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { CommandOptions, ICommand } from 'ui-patterns/CommandMenu'
import { orderSectionFirst, useQuery, useRegisterCommands } from 'ui-patterns/CommandMenu'

const QUERY_PERFORMANCE_COMMAND_ID = 'nav-reports-query-performance'

export function useReportsGotoCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'

  const { reportsAll } = useIsFeatureEnabled(['reports:all'])

  const commandQuery = useQuery()?.toLowerCase() ?? ''
  const prioritizeQueryPerformance = commandQuery.includes('query')

  const orderQueryPerformanceCommand = useMemo(() => {
    if (!prioritizeQueryPerformance) return undefined

    return (existingCommands: ICommand[], incomingCommands: ICommand[]) => {
      const filteredExisting = existingCommands.filter(
        (command) => command.id !== QUERY_PERFORMANCE_COMMAND_ID
      )

      return [...incomingCommands, ...filteredExisting]
    }
  }, [prioritizeQueryPerformance])

  const orderNavigateSection = useMemo<CommandOptions['orderSection'] | undefined>(() => {
    return prioritizeQueryPerformance ? orderSectionFirst : options?.orderSection
  }, [options?.orderSection, prioritizeQueryPerformance])

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    reportsAll
      ? [
          {
            id: 'nav-reports',
            name: 'Reports',
            route: `/project/${ref}/reports`,
            defaultHidden: true,
          },
          {
            id: 'nav-reports-api',
            name: 'API Reports',
            route: `/project/${ref}/reports/api-overview`,
            defaultHidden: true,
          },
          {
            id: 'nav-reports-storage',
            name: 'Storage Reports',
            route: `/project/${ref}/reports/storage`,
            defaultHidden: true,
          },
          {
            id: 'nav-reports-database',
            name: 'Database Reports',
            route: `/project/${ref}/reports/database`,
            defaultHidden: true,
          },
        ]
      : [],
    {
      ...options,
      orderSection: orderNavigateSection,
      deps: [ref, orderNavigateSection, ...(options?.deps ?? [])],
    }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    reportsAll
      ? [
          {
            id: QUERY_PERFORMANCE_COMMAND_ID,
            name: 'Query Performance Reports',
            route: `/project/${ref}/advisors/query-performance`,
            defaultHidden: true,
          },
        ]
      : [],
    {
      ...options,
      orderCommands: orderQueryPerformanceCommand ?? options?.orderCommands,
      orderSection: orderNavigateSection,
      deps: [ref, orderQueryPerformanceCommand, orderNavigateSection, ...(options?.deps ?? [])],
    }
  )
}
