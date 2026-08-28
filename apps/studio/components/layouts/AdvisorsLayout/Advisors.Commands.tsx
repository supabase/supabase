import { useParams } from 'common'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

import { COMMAND_MENU_SECTIONS } from '@/components/interfaces/App/CommandMenu/CommandMenu.utils'
import { IS_PLATFORM } from '@/lib/constants'

export function useAdvisorsGoToCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      ...(IS_PLATFORM
        ? [
            {
              id: 'nav-advisors-health',
              name: 'Health Advisor',
              route: `/project/${ref}/advisors/health`,
              defaultHidden: true,
            },
          ]
        : []),
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
    ],
    { ...options, deps: [ref] }
  )
}
