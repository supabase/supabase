import type { ReactNode } from 'react'
import { sidebarManagerState, useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { MobileSheetNav } from 'ui-patterns'

import { SIDEBAR_KEYS } from '../LayoutSidebar/LayoutSidebarProvider'
import type { TYPEOF_SIDEBAR_KEYS } from '../LayoutSidebar/LayoutSidebarProvider'
import type { MobileSheetContentType } from './MobileSheetContext'
import { useMobileSheet } from './MobileSheetContext'

function isSidebarId(content: unknown): content is TYPEOF_SIDEBAR_KEYS {
  return (
    typeof content === 'string' &&
    Object.values(SIDEBAR_KEYS).includes(content as TYPEOF_SIDEBAR_KEYS)
  )
}

/** Resolve sheet content: sidebar panel (by id) or custom ReactNode (menu, etc.). */
function getSheetChildren(
  content: MobileSheetContentType,
  activeSidebar: { id: string; component?: () => ReactNode } | null
): ReactNode {
  if (content === null) return null
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
    <MobileSheetNav open={content !== null} onOpenChange={handleOpenChange}>
      {sheetChildren}
    </MobileSheetNav>
  )
}

export default StudioMobileSheetNav
