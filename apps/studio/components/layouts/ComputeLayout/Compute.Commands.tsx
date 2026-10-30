import { useParams } from 'common'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

import { COMMAND_MENU_SECTIONS } from '@/components/interfaces/App/CommandMenu/CommandMenu.utils'
import { PRODUCT_NAME } from '@/lib/constants/compute'

export function useComputeGotoCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'
  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-compute',
        name: PRODUCT_NAME,
        route: `/project/${ref}/compute`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [ref] }
  )
}
