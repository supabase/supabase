import { Fragment } from 'react'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { ResizableHandle, ResizablePanel, cn } from 'ui'

export const LayoutSidebar = () => {
  const { activeSidebar } = useSidebarManagerSnapshot()

  if (!activeSidebar?.component) {
    return null
  }

  return (
    <Fragment>
      <ResizableHandle withHandle />
      <ResizablePanel
        id="panel-side"
        key={activeSidebar.id}
        defaultSize={30}
        minSize={30}
        maxSize={50}
        className={cn(
          'border-l bg fixed z-40 right-0 top-0 bottom-0',
          'w-screen h-[100dvh]',
          'md:absolute md:h-auto md:w-3/4',
          'xl:relative xl:border-l-0'
        )}
      >
        {activeSidebar.component()}
      </ResizablePanel>
    </Fragment>
  )
}
