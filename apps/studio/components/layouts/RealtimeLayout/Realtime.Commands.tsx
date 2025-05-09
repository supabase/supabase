import { useParams } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import { orderCommandSectionsByPriority } from 'components/interfaces/App/CommandMenu/ordering'
import { Realtime } from 'icons'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

export function useRealtimeGotoCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.REALTIME,
    [
      {
        id: 'view-realtime-inspector',
        name: 'Inspect your Realtime channels',
        route: `/project/${ref}/realtime/inspector`,
        icon: () => <Realtime />,
      },
      {
        id: 'view-realtime-policies',
        name: 'View your Realtime policies',
        route: `/project/${ref}/realtime/policies`,
        icon: () => <Realtime />,
      },
    ],
    {
      ...options,
      deps: [ref],
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 3 },
    }
  )
}
