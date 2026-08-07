import type { ReactNode } from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cn, ResizableHandle, ResizablePanel, ResizablePanelGroup, usePanelRef } from 'ui'

type PanelSize = number | string

interface ResizableInspectorLayoutProps {
  children: ReactNode
  inspector?: ReactNode
  orientation?: 'horizontal' | 'vertical'
  className?: string
  mainPanelClassName?: string
  inspectorPanelClassName?: string
  handleClassName?: string
  mainPanelId: string
  inspectorPanelId: string
  inspectorLabel: string
  mainMinSize: PanelSize
  inspectorDefaultSize?: PanelSize
  inspectorMinSize: PanelSize
  inspectorMaxSize?: PanelSize
  snapThreshold?: number
}

export const ResizableInspectorLayout = ({
  children,
  inspector,
  orientation = 'horizontal',
  className,
  mainPanelClassName,
  inspectorPanelClassName,
  handleClassName,
  mainPanelId,
  inspectorPanelId,
  inspectorLabel,
  mainMinSize,
  inspectorDefaultSize = 400,
  inspectorMinSize,
  inspectorMaxSize = '60%',
  snapThreshold = typeof mainMinSize === 'number' && typeof inspectorMinSize === 'number'
    ? mainMinSize + inspectorMinSize
    : 600,
}: ResizableInspectorLayoutProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const inspectorPanelRef = usePanelRef()
  const previousInspectorSize = useRef<PanelSize>(inspectorDefaultSize)
  const pendingRestoreSize = useRef<PanelSize | undefined>(undefined)
  const wasInspectorOpenRef = useRef(false)
  const isSnappedRef = useRef(false)
  const [isContainerNarrow, setIsContainerNarrow] = useState(false)

  const hasInspector = inspector !== undefined && inspector !== null
  const isSnapped = hasInspector && isContainerNarrow

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateContainerWidth = (width: number) => {
      const shouldSnap = width > 0 && width <= snapThreshold

      if (isSnappedRef.current && !shouldSnap) {
        pendingRestoreSize.current = previousInspectorSize.current
      }

      isSnappedRef.current = shouldSnap
      setIsContainerNarrow(shouldSnap)
    }

    updateContainerWidth(container.getBoundingClientRect().width)

    const observer = new ResizeObserver(([entry]) => {
      if (entry) updateContainerWidth(entry.contentRect.width)
    })
    observer.observe(container)

    return () => observer.disconnect()
  }, [snapThreshold])

  useEffect(() => {
    const wasInspectorOpen = wasInspectorOpenRef.current
    wasInspectorOpenRef.current = hasInspector

    if (!hasInspector || !wasInspectorOpen || !inspectorPanelRef.current) {
      pendingRestoreSize.current = undefined
      return
    }

    const nextSize = isSnapped
      ? '100%'
      : (pendingRestoreSize.current ?? previousInspectorSize.current)

    inspectorPanelRef.current.resize(nextSize)
    pendingRestoreSize.current = undefined
  }, [hasInspector, inspectorPanelRef, isSnapped])

  return (
    <ResizablePanelGroup
      elementRef={containerRef}
      orientation={isSnapped ? 'horizontal' : orientation}
      className={cn('relative', className)}
      data-inspector-snapped={isSnapped ? '' : undefined}
    >
      <ResizablePanel
        id={mainPanelId}
        defaultSize={isSnapped ? '0%' : '100%'}
        minSize={isSnapped ? '0%' : mainMinSize}
        maxSize={isSnapped ? '0%' : undefined}
        inert={isSnapped ? true : undefined}
        aria-hidden={isSnapped || undefined}
        className={mainPanelClassName}
      >
        {children}
      </ResizablePanel>

      {hasInspector && (
        <>
          <ResizableHandle
            withHandle
            disabled={isSnapped}
            className={cn(isSnapped && 'hidden', handleClassName)}
          />
          <ResizablePanel
            id={inspectorPanelId}
            panelRef={inspectorPanelRef}
            defaultSize={isSnapped ? '100%' : inspectorDefaultSize}
            minSize={isSnapped ? '100%' : inspectorMinSize}
            maxSize={isSnapped ? '100%' : inspectorMaxSize}
            role="region"
            aria-label={inspectorLabel}
            className={inspectorPanelClassName}
            onResize={(size) => {
              if (
                !isSnappedRef.current &&
                pendingRestoreSize.current === undefined &&
                size.inPixels > 0
              ) {
                previousInspectorSize.current = size.inPixels
              }
            }}
          >
            {inspector}
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}
