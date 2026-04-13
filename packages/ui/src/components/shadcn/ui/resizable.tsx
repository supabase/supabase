'use client'

import { GripVertical } from 'lucide-react'
import * as ResizablePrimitive from 'react-resizable-panels'

import { cn } from '../../../lib/utils/cn'

// This is to avoid clashes with older versions of react-resizable-panels which have been saved in local storage.
const transformLayoutKey = (key: string) =>
  key.replace('react-resizable-panels:', 'react-resizable-panels-v4:')

const serverCompatibleLocalStorage = {
  getItem: (k: string) => {
    if (typeof window === 'undefined') return null
    const key = transformLayoutKey(k)
    return localStorage.getItem(key)
  },
  setItem: (k: string, value: string) => {
    if (typeof window === 'undefined') return
    const key = transformLayoutKey(k)
    localStorage.setItem(key, value)
  },
}

const ResizablePanelGroupWithPersistence = ({
  className,
  autoSaveId,
  defaultLayout: defaultLayoutProp,
  onLayoutChanged: onLayoutChangedProp,
  ...props
}: ResizablePrimitive.GroupProps & { autoSaveId: string }) => {
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: autoSaveId,
    storage: serverCompatibleLocalStorage,
  })

  return (
    <ResizablePrimitive.Group
      defaultLayout={defaultLayoutProp ?? defaultLayout}
      onLayoutChanged={onLayoutChangedProp ?? onLayoutChanged}
      className={cn('flex h-full w-full aria-[orientation=vertical]:flex-col', className)}
      data-slot="resizable-panel-group"
      {...props}
    />
  )
}

const ResizablePanelGroup = ({
  className,
  autoSaveId,
  ...props
}: ResizablePrimitive.GroupProps & { autoSaveId?: string }) => {
  if (autoSaveId) {
    return (
      <ResizablePanelGroupWithPersistence
        autoSaveId={autoSaveId}
        className={className}
        {...props}
      />
    )
  }

  return (
    <ResizablePrimitive.Group
      className={cn('flex h-full w-full aria-[orientation=vertical]:flex-col', className)}
      data-slot="resizable-panel-group"
      {...props}
    />
  )
}

const ResizablePanel = ({ ...props }: ResizablePrimitive.PanelProps) => {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />
}

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: ResizablePrimitive.SeparatorProps & {
  withHandle?: boolean
}) => {
  return (
    <ResizablePrimitive.Separator
      className={cn(
        'relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-1 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:-translate-y-1/2 aria-[orientation=horizontal]:after:translate-x-0 [&[aria-orientation=horizontal]>div]:rotate-90',
        'data-[separator=active]:bg-border-strong',
        'group',
        'transition-colors',
        className
      )}
      style={{ cursor: 'auto' }}
      {...props}
    >
      {withHandle && (
        <div
          className={cn(
            'z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border focus:bg-surface-400',
            'opacity-0 transition-opacity duration-200',
            'group-data-[separator=hover]:opacity-100',
            'hover:bg-surface-400',
            'group-data-[separator=active]:opacity-100',
            'group-data-[separator=active]:bg-foreground-muted'
          )}
        >
          <GripVertical className="h-2.5 w-2.5" />
        </div>
      )}
    </ResizablePrimitive.Separator>
  )
}

const useDefaultLayout = ResizablePrimitive.useDefaultLayout
const usePanelRef = ResizablePrimitive.usePanelRef

export { ResizableHandle, ResizablePanel, ResizablePanelGroup, useDefaultLayout, usePanelRef }
