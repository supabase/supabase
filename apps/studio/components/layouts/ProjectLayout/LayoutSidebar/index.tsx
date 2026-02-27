import { useBreakpoint } from 'common'
import { useEffect } from 'react'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { cn, ResizableHandle, ResizablePanel } from 'ui'
import { MobileSheetNav } from 'ui-patterns'

import { useMobileSheet } from '../NavigationBar/MobileSheetContext'

// Having these params as props as otherwise it's quite hard to visually check the sizes in DefaultLayout
// as react resizeable panels requires all these values to be valid to render correctly
interface LayoutSidebarProps {
  minSize?: string | number
  maxSize?: string | number
  defaultSize?: string | number
}

export const LayoutSidebar = ({
  minSize = '30',
  maxSize = '50',
  defaultSize = '30',
}: LayoutSidebarProps) => {
  const { activeSidebar, closeActive } = useSidebarManagerSnapshot()
  const isMobile = useBreakpoint('md')
  const { content: mobileSheetContent, setContent: setMobileSheetContent } = useMobileSheet()

  // On mobile the sidebar content is rendered in MobileSheetNav
  useEffect(() => {
    if (isMobile && activeSidebar?.component) {
      setMobileSheetContent(activeSidebar.id)
    } else {
      setMobileSheetContent(null)
    }
  }, [isMobile, activeSidebar, setMobileSheetContent])

  if (!activeSidebar?.component) return null

  if (isMobile)
    return (
      <MobileSheetNav
        shouldCloseOnRouteChange={false}
        shouldCloseOnViewportResize={false}
        open={mobileSheetContent !== null}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setMobileSheetContent(null)
            closeActive()
          }
        }}
      >
        {activeSidebar?.component?.()}
      </MobileSheetNav>
    )

  return (
    <>
      <ResizableHandle withHandle />
      <ResizablePanel
        id="panel-side"
        key={activeSidebar?.id ?? 'default'}
        defaultSize={defaultSize}
        minSize={minSize}
        maxSize={maxSize}
        className={cn(
          'border-l bg fixed z-40 right-0 top-0 bottom-0',
          'h-[100dvh]',
          'md:absolute md:h-auto md:w-1/2',
          'lg:w-2/5',
          'xl:relative xl:border-l-0'
        )}
      >
        {activeSidebar?.component()}
      </ResizablePanel>
    </>
  )
}
