import { useParams, useViewport } from 'common'
import { AdvisorButton } from 'components/layouts/AppLayout/AdvisorButton'
import { AssistantButton } from 'components/layouts/AppLayout/AssistantButton'
import { InlineEditorButton } from 'components/layouts/AppLayout/InlineEditorButton'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { HelpButton } from 'components/ui/HelpPanel/HelpButton'
import { AnimatePresence } from 'framer-motion'
import { Menu, Search, X } from 'lucide-react'
import { useRef } from 'react'
import { Button, cn, KeyboardShortcut } from 'ui'

import { getToolbarStyle } from './FloatingMobileToolbar.utils'
import { useFloatingToolbarDrag } from './useFloatingToolbarDrag'
import { useFloatingToolbarNavSize } from './useFloatingToolbarNavSize'
import { useFloatingToolbarSheet } from './useFloatingToolbarSheet'
import { useFloatingToolbarSidebarClick } from './useFloatingToolbarSidebarClick'

const FloatingMobileToolbar = ({ hideMobileMenu }: { hideMobileMenu?: boolean }) => {
  const navRef = useRef<HTMLElement | null>(null)
  const sheet = useFloatingToolbarSheet(hideMobileMenu)
  const drag = useFloatingToolbarDrag(navRef)
  const handleNavClickCapture = useFloatingToolbarSidebarClick()
  const navSize = useFloatingToolbarNavSize(navRef, sheet.isSheetOpen)
  const viewport = useViewport()
  const { handleSearchClick, isSearchOpen } = sheet

  const style = getToolbarStyle({
    position: drag.position,
    navSize,
    isSheetOpen: sheet.isSheetOpen,
    viewport,
    isDragging: drag.dragStartRef.current !== null,
  })

  const { ref: projectRef } = useParams()

  return (
    <nav
      ref={navRef}
      aria-label="Floating toolbar"
      className={cn(
        'flex pointer-events-auto cursor-grab active:cursor-grabbing flex-row items-centerw-auto',
        'gap-2',
        'fixed md:hidden'
      )}
      style={style}
      onClickCapture={handleNavClickCapture}
      onPointerDown={drag.handlePointerDown}
      onPointerMove={drag.handlePointerMove}
    >
      <div
        className={cn(
          'flex pointer-events-auto cursor-grab active:cursor-grabbing flex-row items-center justify-between w-auto rounded-full',
          'bg-overlay/80 backdrop-blur-md px-2.5 py-2 gap-2',
          'border border-strong shadow-[0px_3px_6px_-2px_rgba(0,0,0,0.07),0px_10px_30px_0px_rgba(0,0,0,0.10)]'
        )}
      >
        <AnimatePresence initial={false}>
          <ButtonTooltip
            type={isSearchOpen ? 'secondary' : 'outline'}
            size="tiny"
            id="search-trigger"
            className={cn(
              'rounded-full w-[32px] h-[32px] flex items-center justify-center p-0',
              isSearchOpen && 'text-background'
            )}
            tooltip={{
              content: {
                className: 'p-1 pl-2.5',
                text: (
                  <div className="flex items-center gap-2.5">
                    <span>Search</span>
                    <KeyboardShortcut keys={['Meta', 'K']} />
                  </div>
                ),
              },
            }}
            onClick={handleSearchClick}
          >
            <Search size={16} strokeWidth={1} />
          </ButtonTooltip>
          <span data-sidebar-id={SIDEBAR_KEYS.HELP_PANEL}>
            <HelpButton />
          </span>
          <span data-sidebar-id={SIDEBAR_KEYS.ADVISOR_PANEL}>
            <AdvisorButton projectRef={projectRef} />
          </span>
          {!!projectRef && (
            <>
              <span data-sidebar-id={SIDEBAR_KEYS.EDITOR_PANEL}>
                <InlineEditorButton />
              </span>
              <span data-sidebar-id={SIDEBAR_KEYS.AI_ASSISTANT}>
                <AssistantButton />
              </span>
            </>
          )}
          {sheet.showMenuButton && sheet.isSheetOpen && (
            <Button
              title="Menu dropdown button"
              type={sheet.isMenuOpen ? 'secondary' : 'default'}
              className={cn(
                'flex lg:hidden mr-1 rounded-md min-w-[30px] w-[30px] h-[30px] data-[state=open]:bg-overlay-hover/30',
                !sheet.isMenuOpen && '!bg-surface-300'
              )}
              icon={<Menu />}
              onClick={sheet.handleMenuClick}
            />
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence initial={false}>
        <Button
          title="close"
          type="text"
          className={cn(
            'flex flex-row items-center justify-center rounded-full',
            'bg-overlay/50 backdrop-blur-md my-auto !p-1 gap-2',
            'border border-strong shadow-[0px_3px_6px_-2px_rgba(0,0,0,0.07),0px_10px_30px_0px_rgba(0,0,0,0.10)]',
            '!w-10 !h-10 !min-w-10 !min-h-10',
            'rounded-full',
            !sheet.isSheetOpen && 'hidden'
          )}
          icon={<X />}
          onClick={sheet.handleClose}
        />
      </AnimatePresence>
    </nav>
  )
}

export default FloatingMobileToolbar
