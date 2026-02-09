import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { cn, ResizableHandle, ResizablePanel } from 'ui'

import { useIsSidebarToolbarEnabled } from '../../../interfaces/App/FeaturePreview/FeaturePreviewContext'

// Having these params as props as otherwise it's quite hard to visually check the sizes in DefaultLayout
// as react resizeable panels requires all these values to be valid to render correctly
interface LayoutSidebarProps {
  order?: number
  minSize?: number
  maxSize?: number
  defaultSize?: number
}

export const LayoutSidebar = ({
  order = 2,
  minSize = 30,
  maxSize = 50,
  defaultSize = 30,
}: LayoutSidebarProps) => {
  const { activeSidebar } = useSidebarManagerSnapshot()
  const showSidebarToolbar = useIsSidebarToolbarEnabled()

  if (!activeSidebar?.component) return null

  return (
    <>
      <ResizableHandle withHandle />
      <ResizablePanel
        id="panel-side"
        key={activeSidebar?.id ?? 'default'}
        order={order}
        defaultSize={defaultSize}
        minSize={minSize}
        maxSize={maxSize}
        className={cn(
          'border-l bg fixed z-40 right-0 top-0 bottom-0',
          'h-[100dvh]',
          'md:absolute md:h-auto md:w-1/2',
          'lg:w-2/5',
          'xl:relative xl:border-l-0',
          showSidebarToolbar &&
            'border-t md:!border-t-0 md:border-l h-[calc(100dvh-50px)] xl:h-[calc(100dvh-48px)] md:top-[48px] xl:top-0 bottom-50 md:bottom-0 w-full md:w-1/2 lg:w-2/5'
        )}
      >
        {activeSidebar?.component()}
      </ResizablePanel>
    </>
  )
}
