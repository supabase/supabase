import { useBreakpoint } from 'common'
import type { ReactNode } from 'react'
import { CommandWrapper } from 'ui-patterns/CommandMenu'
import { MobileSheetNav } from 'ui-patterns/MobileSheetNav'

import {
  SIDEBAR_KEYS,
  type TYPEOF_SIDEBAR_KEYS,
} from '../../ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import type { MobileSheetContentType } from './MobileSheetContext'
import { useMobileSheet } from './MobileSheetContext'
import { CommandMenuInnerContent } from '@/components/interfaces/App/CommandMenu/CommandMenu'
import { sidebarManagerState, useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

function isSidebarId(content: unknown): content is TYPEOF_SIDEBAR_KEYS {
  return (
    typeof content === 'string' &&
    Object.values(SIDEBAR_KEYS).includes(content as TYPEOF_SIDEBAR_KEYS)
  )
}

function getSheetChildren(
  content: MobileSheetContentType,
  activeSidebar: { id: string; component?: () => ReactNode } | null
): ReactNode {
  if (content === null) return null
  if (content === 'search') {
    return (
      <CommandWrapper className="h-full flex flex-col bg-background">
        <CommandMenuInnerContent />
      </CommandWrapper>
    )
  }
  if (isSidebarId(content) && activeSidebar?.id === content) {
    return activeSidebar.component?.() ?? null
  }
  if (!isSidebarId(content)) return content
  return null
}

export const StudioMobileSheetNav = () => {
  const isMobile = useBreakpoint('md')
  const { content, setContent } = useMobileSheet()
  const { activeSidebar } = useSidebarManagerSnapshot()
  const sheetChildren = getSheetChildren(content, activeSidebar ?? null)

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setContent(null)
      sidebarManagerState.closeActive()
    }
  }

  if (!isMobile) return null

  return (
    <MobileSheetNav
      open={content !== null}
      onOpenChange={handleOpenChange}
      shouldCloseOnViewportResize={!activeSidebar}
      onPointerDownOutside={(event) => {
        // Buttons in the floating toolbar (#mobile-nav-actions) render outside this sheet, so
        // Radix treats taps on them as an outside click and closes the sheet before the button's
        // own onClick runs. Those buttons already manage the sheet themselves, so don't let
        // Radix's outside-dismiss pre-empt them.
        if ((event.target as HTMLElement | null)?.closest('#mobile-nav-actions')) {
          event.preventDefault()
        }
      }}
    >
      {sheetChildren}
    </MobileSheetNav>
  )
}
