import { useBreakpoint } from 'common'
import { useEffect } from 'react'
import { cn, ResizableHandle, ResizablePanel } from 'ui'

import { SIDEBAR_KEYS, type TYPEOF_SIDEBAR_KEYS } from './LayoutSidebarProvider'
import { useMobileSheet } from '@/components/layouts/Navigation/NavigationBar/MobileSheetContext'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

function isSidebarId(content: unknown): content is TYPEOF_SIDEBAR_KEYS {
  return (
    typeof content === 'string' &&
    Object.values(SIDEBAR_KEYS).includes(content as TYPEOF_SIDEBAR_KEYS)
  )
}

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
  const { content: sheetContent, setContent: setMobileSheetContent } = useMobileSheet()

  useEffect(() => {
    if (!isMobile) {
      setMobileSheetContent(null)
      return
    }
    if (activeSidebar?.component) {
      setMobileSheetContent(activeSidebar.id)
    } else if (isSidebarId(sheetContent)) {
      setMobileSheetContent(null)
    }
  }, [isMobile, activeSidebar, sheetContent, setMobileSheetContent])

  if (!activeSidebar?.component) return null
  if (isMobile) return null

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
