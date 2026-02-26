import { sidebarManagerState, useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { MobileSheetNav } from 'ui-patterns'

import { useMobileSheet } from './MobileSheetContext'

export function MobileSheetNavLayout() {
  const { content: mobileSheetContent, setContent: setMobileSheetContent } = useMobileSheet()
  const { activeSidebar } = useSidebarManagerSnapshot()

  return (
    <MobileSheetNav
      open={mobileSheetContent !== null}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setMobileSheetContent(null)
          sidebarManagerState.closeActive()
        }
      }}
    >
      {activeSidebar?.component?.() ?? null}
    </MobileSheetNav>
  )
}
