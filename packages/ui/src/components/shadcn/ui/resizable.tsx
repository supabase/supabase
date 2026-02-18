'use client'

import { GripVertical } from 'lucide-react'
import * as ResizablePrimitive from 'react-resizable-panels'
import { ImperativePanelHandle } from 'react-resizable-panels'

import { cn } from '../../../lib/utils/cn'

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn('flex h-full w-full data-[panel-group-direction=vertical]:flex-col', className)}
    {...props}
  />
)

const ResizablePanel = ResizablePrimitive.Panel

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      'relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90',
      'data-[resize-handle-state=drag]:bg-border-strong',
      'group',
      'transition-colors',
      className
    )}
    {...props}
  >
    {withHandle && (
      <div
        className={cn(
          'z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border focus:bg-surface-400',
          'opacity-0 transition-opacity duration-200',
          'group-data-[resize-handle-state=hover]:opacity-100',
          'hover:bg-surface-400',
          'group-data-[resize-handle-state=drag]:opacity-100',
          'group-data-[resize-handle-state=drag]:bg-foreground-muted'
        )}
      >
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
)

export { ResizableHandle, ResizablePanel, ResizablePanelGroup, type ImperativePanelHandle }
