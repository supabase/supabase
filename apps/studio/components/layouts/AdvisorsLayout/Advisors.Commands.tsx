import { useParams } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

export function useAdvisorsGoToCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-advisors-security',
        name: 'Security Advisor',
        route: `/project/${ref}/advisors/security`,
        defaultHidden: true,
      },
      {
        id: 'nav-advisors-performance',
        name: 'Performance Advisor',
        route: `/project/${ref}/advisors/performance`,
        defaultHidden: true,
      },
      {
        id: 'nav-advisors-query-performance',
        name: 'Query Performance',
        route: `/project/${ref}/advisors/query-performance`,
        defaultHidden: true,
      },
      {
        id: 'nav-advisors-query',
        name: 'Query Insights',
        route: `/project/${ref}/advisors/query-insights`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [ref] }
  )
}
