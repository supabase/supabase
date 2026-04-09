import type { ReactNode } from 'react'
import { CommandWrapper, MobileSheetNav } from 'ui-patterns'

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

const StudioMobileSheetNav = () => {
  const { content, setContent } = useMobileSheet()
  const { activeSidebar } = useSidebarManagerSnapshot()
  const sheetChildren = getSheetChildren(content, activeSidebar ?? null)

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setContent(null)
      sidebarManagerState.closeActive()
    }
  }

  return (
    <MobileSheetNav
      open={content !== null}
      onOpenChange={handleOpenChange}
      shouldCloseOnViewportResize={!activeSidebar}
    >
      {sheetChildren}
    </MobileSheetNav>
  )
}

export { StudioMobileSheetNav }
