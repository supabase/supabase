import { useParams } from 'common'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

import { COMMAND_MENU_SECTIONS } from '@/components/interfaces/App/CommandMenu/CommandMenu.utils'

export function useIssuesGoToCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      { id: 'nav-issues', name: 'Issues', route: `/project/${ref}/issues`, defaultHidden: true },
      {
        id: 'nav-issues-security',
        name: 'Security issues',
        route: `/project/${ref}/issues?category=security`,
        defaultHidden: true,
      },
      {
        id: 'nav-issues-performance',
        name: 'Performance issues',
        route: `/project/${ref}/issues?category=performance`,
        defaultHidden: true,
      },
      {
        id: 'nav-issues-health',
        name: 'Health issues',
        route: `/project/${ref}/issues?category=health`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [ref] }
  )
}
