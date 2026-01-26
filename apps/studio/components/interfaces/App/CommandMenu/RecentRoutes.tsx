import { History } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

import { useParams } from 'common'
import { useRecentRoutes } from 'hooks/misc/useRecentRoutes'
import { useRegisterCommands, useSetCommandMenuOpen } from 'ui-patterns/CommandMenu'
import { COMMAND_MENU_SECTIONS } from './CommandMenu.utils'
import { orderCommandSectionsByPriority } from './ordering'

export function useRecentRoutesCommands() {
  const router = useRouter()
  const { ref } = useParams()
  const setIsOpen = useSetCommandMenuOpen()
  const { recentRoutes } = useRecentRoutes()

  const commands = useMemo(() => {
    return recentRoutes.map((route) => ({
      id: `recent-${route.key}`,
      name: route.childName,
      // Include parent label in value for search
      value: route.parentLabel ? `${route.childName} ${route.parentLabel}` : route.childName,
      action: () => {
        router.push(route.link)
        setIsOpen(false)
      },
      icon: () => <History size={18} />,
      badge: route.parentLabel
        ? () => <span className="text-xs text-foreground-muted">{route.parentLabel}</span>
        : undefined,
    }))
  }, [recentRoutes, router, setIsOpen])

  useRegisterCommands(COMMAND_MENU_SECTIONS.RECENTS, commands, {
    enabled: !!ref && commands.length > 0,
    deps: [commands],
    orderSection: orderCommandSectionsByPriority,
    sectionMeta: { priority: 1 },
  })
}
