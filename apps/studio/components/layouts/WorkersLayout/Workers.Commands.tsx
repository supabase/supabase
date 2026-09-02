import { useParams } from 'common'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

import { COMMAND_MENU_SECTIONS } from '@/components/interfaces/App/CommandMenu/CommandMenu.utils'
import { PRODUCT_NAME } from '@/lib/constants/workers'

export function useWorkersGotoCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'
  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-workers',
        name: PRODUCT_NAME,
        route: `/project/${ref}/workers`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [ref] }
  )
}
