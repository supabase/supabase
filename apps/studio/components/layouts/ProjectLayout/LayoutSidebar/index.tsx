import { useBreakpoint } from 'common'
import { useEffect } from 'react'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { cn, ResizableHandle, ResizablePanel } from 'ui'

import { useMobileSidebarSheet } from './MobileSidebarSheetContext'

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
  const { activeSidebar } = useSidebarManagerSnapshot()
  const isMobile = useBreakpoint('md')
  const { setOpen: setMobileSheetOpen } = useMobileSidebarSheet()

  // On mobile the sheet is rendered in MobileNavigationBar; we only sync open state when sidebar is toggled
  useEffect(() => {
    if (isMobile) {
      if (activeSidebar?.component) {
        setMobileSheetOpen(true)
      } else {
        // setMobileSheetOpen(false)
      }
    }
  }, [isMobile, activeSidebar, setMobileSheetOpen])

  if (isMobile) return null

  if (!activeSidebar?.component) return null

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
