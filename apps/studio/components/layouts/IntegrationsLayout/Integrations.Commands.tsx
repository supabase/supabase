import { Blocks, Search } from 'lucide-react'

import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'
import { useParams } from 'common'
import { orderCommandSectionsByPriority } from 'components/interfaces/App/CommandMenu/ordering'
import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'

export function useIntegrationsGotoCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'

  const wrappersArray = INTEGRATIONS.sort((a, b) => a.name.localeCompare(b.name)).map((m) => {
    return {
      id: `integrations-view-${m.id}`,
      name: m.name,
      route: `/project/${ref}/integrations/${m.id}/overview` as `/${string}`,
      icon: () => (
        <div className="w-5 h-5 relative flex items-center justify-center">
          {m.icon({ className: 'w-8 h-8 p-0' })}
        </div>
      ),
    }
  })
  console.log(INTEGRATIONS)

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.INTEGRATIONS,
    [
      {
        id: 'integrations-view-all',
        name: 'View all Integrations',
        route: `/project/${ref}/integrations`,
        icon: () => <Blocks />,
      },
      {
        id: 'integrations-view-wrappers',
        name: 'View all Wrappers',
        route: `/project/${ref}/integrations?category=wrapper`,
        icon: () => <Blocks />,
      },
      {
        id: 'integrations-view-postgres-modules',
        name: 'View all Postgres Modules',
        route: `/project/${ref}/integrations?category=postgres_extension`,
        icon: () => <Blocks />,
      },
    ],
    {
      ...options,
      deps: [ref],
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 3 },
    }
  )

  useRegisterCommands(COMMAND_MENU_SECTIONS.INTEGRATIONS, wrappersArray, {
    ...options,
    deps: [ref],
    orderSection: orderCommandSectionsByPriority,
    sectionMeta: { priority: 3 },
  })
}
