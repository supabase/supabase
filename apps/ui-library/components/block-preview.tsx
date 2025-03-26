'use client'

import * as React from 'react'
import { cn } from 'ui'

interface ComponentPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  align?: 'center' | 'start' | 'end'
  showGrid?: boolean
  showDottedGrid?: boolean
  wide?: boolean
}

export function BlockPreview({
  name,
  align = 'center',
  showGrid = false,
  showDottedGrid = true,
  wide = false,
}: ComponentPreviewProps) {
  const BlockPreview = React.useMemo(() => {
    return (
      <>
        <div className={cn('preview relative w-full h-full theme-original')}>
          <React.Suspense
            fallback={
              <div className="flex items-center text-sm text-muted-foreground">Loading...</div>
            }
          >
            <iframe
              src={`/ui/example/${name}`}
              className="absolute inset-0 w-full h-full"
              style={{ border: 'none' }}
              name="preview-frame"
            />
          </React.Suspense>
        </div>
      </>
    )
  }, [align, name])

  const wideClasses = wide ? '2xl:-ml-12 2xl:-mr-12' : ''

  return (
    <div className={cn('mt-4 w-full', wideClasses)}>
      <div className={cn('relative border bg-studio min-h-[350px] h-[600px]')}>
        {showGrid && (
          <div className="pointer-events-none absolute h-full w-full bg-[linear-gradient(to_right,hsla(var(--foreground-default)/0.02)_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        )}
        {showDottedGrid && (
          <div className="z-0 pointer-events-none absolute h-full w-full bg-[radial-gradient(hsla(var(--foreground-default)/0.02)_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        )}
        <div className="z-10 relative h-full w-full">{BlockPreview}</div>
      </div>
    </div>
  )
}
