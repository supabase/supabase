import { CommandMenuInnerContent } from 'components/interfaces/App/CommandMenu/CommandMenu'
import { sidebarManagerState, useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { CommandWrapper, MobileSheetNav } from 'ui-patterns'

import { useMobileSheet } from './MobileSheetContext'

const MobileSheetNavLayout = () => {
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
      {mobileSheetContent === 'search' ? (
        <CommandWrapper className="h-full flex flex-col bg-background">
          <CommandMenuInnerContent />
        </CommandWrapper>
      ) : (
        activeSidebar?.component?.() ?? null
      )}
    </MobileSheetNav>
  )
}

export default MobileSheetNavLayout
