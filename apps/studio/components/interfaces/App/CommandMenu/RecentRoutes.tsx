import { History } from 'lucide-react'
import { useMemo } from 'react'

import { useRecentRoutes } from 'hooks/misc/useRecentRoutes'
import { useRegisterCommands, useSetCommandMenuOpen } from 'ui-patterns/CommandMenu'
import { COMMAND_MENU_SECTIONS } from './CommandMenu.utils'
import { orderCommandSectionsByPriority } from './ordering'
import { useRouter } from 'next/router'
import { useParams } from 'common'

export function useRecentRoutesCommands() {
  const router = useRouter()
  const { ref } = useParams()
  const setIsOpen = useSetCommandMenuOpen()
  const { recentRoutes } = useRecentRoutes()

  const commands = useMemo(() => {
    return recentRoutes.map((route) => {
      // Format: "Parent > Child" (e.g., "Authentication > Users")
      const displayName = route.parentLabel
        ? `${route.parentLabel} > ${route.childName}`
        : route.childName

      return {
        id: `recent-${route.key}`,
        name: displayName,
        action: () => {
          router.push(route.link)
          setIsOpen(false)
        },
        icon: () => <History size={18} />,
      }
    })
  }, [recentRoutes, router, setIsOpen])

  useRegisterCommands(COMMAND_MENU_SECTIONS.RECENTS, commands, {
    enabled: !!ref && commands.length > 0,
    deps: [commands],
    orderSection: orderCommandSectionsByPriority,
    sectionMeta: { priority: 1 },
  })
}
