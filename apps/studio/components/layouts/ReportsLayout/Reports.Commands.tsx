import { useParams } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

export function useReportsGotoCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'

  const { reportsAll } = useIsFeatureEnabled(['reports:all'])

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
          {
            id: 'nav-reports-query-performance',
            name: 'Query Performance Reports',
            route: `/project/${ref}/advisors/query-performance`,
            defaultHidden: true,
          },
        ]
      : [],
    { ...options, deps: [ref] }
  )
}
