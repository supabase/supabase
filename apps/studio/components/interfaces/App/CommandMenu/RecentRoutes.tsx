import { History } from 'lucide-react'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useRef } from 'react'

import { useParams } from 'common'
import { useRecentRoutes } from 'hooks/misc/useRecentRoutes'
import {
  PageType,
  useRegisterCommands,
  useRegisterPage,
  useSetCommandMenuOpen,
  useSetPage,
} from 'ui-patterns/CommandMenu'
import { COMMAND_MENU_SECTIONS } from './CommandMenu.utils'
import { orderCommandSectionsByPriority } from './ordering'

const RECENTS_PAGE_NAME = 'All Recents'
const VISIBLE_RECENTS_COUNT = 2

export function useRecentRoutesCommands() {
  const router = useRouter()
  const { ref } = useParams()
  const setIsOpen = useSetCommandMenuOpen()
  const setPage = useSetPage()
  const { recentRoutes } = useRecentRoutes()

  // Use refs to keep callbacks stable while accessing latest values
  const routerRef = useRef(router)
  const setIsOpenRef = useRef(setIsOpen)
  const setPageRef = useRef(setPage)
  routerRef.current = router
  setIsOpenRef.current = setIsOpen
  setPageRef.current = setPage

  // Stable navigation function using refs
  const navigateTo = useCallback((link: string) => {
    routerRef.current.push(link)
    setIsOpenRef.current(false)
  }, [])

  // Stable page navigation using ref
  const goToAllRecents = useCallback(() => {
    setPageRef.current(RECENTS_PAGE_NAME)
  }, [])

  // Create command objects from recent routes - only depend on the route data, not callbacks
  const allCommands = useMemo(() => {
    return recentRoutes.map((route) => ({
      id: `recent-${route.key}`,
      name: route.childName,
      value: route.parentLabel ? `${route.childName} ${route.parentLabel}` : route.childName,
      link: route.link,
      parentLabel: route.parentLabel,
    }))
  }, [recentRoutes])

  // Convert to ICommand format with actions
  const allCommandsWithActions = useMemo(() => {
    return allCommands.map((cmd) => ({
      id: cmd.id,
      name: cmd.name,
      value: cmd.value,
      action: () => navigateTo(cmd.link),
      icon: () => <History size={18} />,
      badge: cmd.parentLabel
        ? () => <span className="text-xs text-foreground-muted">{cmd.parentLabel}</span>
        : undefined,
    }))
  }, [allCommands, navigateTo])

  // Commands shown in the main menu (first 2 or 3)
  const visibleCommandsWithActions = useMemo(() => {
    return allCommandsWithActions.slice(0, VISIBLE_RECENTS_COUNT)
  }, [allCommandsWithActions])

  // Register the "All recents" subpage with all commands
  useRegisterPage(
    RECENTS_PAGE_NAME,
    {
      type: PageType.Commands,
      sections: [
        {
          id: 'all-recents',
          name: 'All Recents',
          commands: allCommandsWithActions,
        },
      ],
    },
    { deps: [allCommandsWithActions], enabled: !!ref && allCommands.length > VISIBLE_RECENTS_COUNT }
  )

  // Register the visible commands + "All recents..." link
  const commandsWithAllRecents = useMemo(() => {
    const commands = [...visibleCommandsWithActions]

    // Add "View more recents..." command if there are more than visible
    if (allCommands.length > VISIBLE_RECENTS_COUNT) {
      commands.push({
        id: 'all-recents',
        name: 'View more...',
        value: 'More recents',
        action: goToAllRecents,
        icon: () => <History size={18} />,
        badge: undefined,
      })
    }

    return commands
  }, [visibleCommandsWithActions, allCommands.length, goToAllRecents])

  useRegisterCommands(COMMAND_MENU_SECTIONS.RECENTS, commandsWithAllRecents, {
    enabled: !!ref && commandsWithAllRecents.length > 0,
    deps: [commandsWithAllRecents],
    orderSection: orderCommandSectionsByPriority,
    sectionMeta: { priority: 1 },
  })
}
