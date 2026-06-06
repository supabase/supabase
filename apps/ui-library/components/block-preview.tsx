'use client'

import * as React from 'react'
import { cn } from 'ui'

interface ComponentPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  wide?: boolean
  isPair?: boolean
}

export function BlockPreview({
  name,
  wide = false,
  isPair = false,
  className,
  ...props
}: ComponentPreviewProps) {

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
  const iframeSrc = `${basePath}/example/${name}`

  const previewContent = React.useMemo(() => {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <React.Suspense
          fallback={
            <div className="flex items-center text-sm text-muted-foreground">
              Loading...
            </div>
          }
        >
          <iframe
            src={iframeSrc}
            name="preview-frame"
            style={{
              border: 'none',
              width: '100%',
              height: '100%',
              display: 'block',
            }}
          />
        </React.Suspense>
      </div>
    )
  }, [iframeSrc])

  const wideClasses = wide ? '2xl:-ml-12 2xl:-mr-12' : ''

  return (
    <div
      className={cn('mt-4 w-full', wideClasses, className)}
      {...props}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border bg-muted min-h-[150px] h-[600px]',
          isPair && 'rounded-none'
        )}
      >
        {previewContent}
      </div>
    </div>
  )
}
