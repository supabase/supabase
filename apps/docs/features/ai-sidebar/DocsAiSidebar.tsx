'use client'

import { useBreakpoint } from 'common'
import { GripVertical } from 'lucide-react'
import { cn, Sheet, SheetContent } from 'ui'

import { DocsAiSidebarContent } from './DocsAiSidebarContent'
import { useDocsAiSidebar } from './DocsAiSidebarContext'

function SidebarResizeHandle() {
  const { startSidebarResize, isResizingSidebar } = useDocsAiSidebar()

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize AI sidebar"
      onMouseDown={startSidebarResize}
      className={cn(
        'group/handle absolute top-0 left-0 z-10 h-full w-2 -translate-x-1/2 cursor-col-resize',
        isResizingSidebar && 'cursor-col-resize'
      )}
    >
      <div
        className={cn(
          'absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition-colors',
          'group-hover/handle:bg-border-strong',
          isResizingSidebar && 'bg-border-strong'
        )}
      />
      <div
        className={cn(
          'absolute top-1/2 left-1/2 z-10 flex h-4 w-3 -translate-x-1/2 -translate-y-1/2',
          'items-center justify-center rounded-xs border bg-background opacity-0 transition-opacity',
          'group-hover/handle:opacity-100',
          isResizingSidebar && 'opacity-100'
        )}
      >
        <GripVertical className="h-2.5 w-2.5 text-foreground-muted" />
      </div>
    </div>
  )
}

function DocsAiSidebar() {
  const { isOpen, close, sidebarWidth, isResizingSidebar } = useDocsAiSidebar()
  const isBelowLg = useBreakpoint('lg')

  if (isBelowLg) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <SheetContent
          side="right"
          className="w-full max-w-md p-0 sm:max-w-md"
          showClose={false}
        >
          <DocsAiSidebarContent className="h-full" />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <aside
      aria-label="Supabase AI assistant"
      aria-hidden={!isOpen}
      className={cn(
        'fixed top-(--header-height) right-0 z-40',
        'h-[calc(100vh-var(--header-height))]',
        'border-l border-default bg-background shadow-lg',
        isResizingSidebar ? 'transition-none' : 'transition-transform duration-300 ease-out',
        isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
      )}
      style={{ width: sidebarWidth }}
    >
      <SidebarResizeHandle />
      <DocsAiSidebarContent />
    </aside>
  )
}

export { DocsAiSidebar }
