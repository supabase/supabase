'use client'

import * as React from 'react'
import { cn } from 'ui'

interface ComponentPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  wide?: boolean
}

export function BlockPreview({ name, wide = false }: ComponentPreviewProps) {
  const BlockPreview = React.useMemo(() => {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <React.Suspense
          fallback={
            <div className="flex items-center text-sm text-muted-foreground">Loading...</div>
          }
        >
          <iframe
            src={`/ui/example/${name}`}
            style={{
              border: 'none',
              width: '100%',
              height: '100%',
              display: 'block',
            }}
            name="preview-frame"
          />
        </React.Suspense>
      </div>
    )
  }, [name])

  const wideClasses = wide ? '2xl:-ml-12 2xl:-mr-12' : ''

  return (
    <div className={cn('mt-4 w-full', wideClasses)}>
      <div className={cn('relative border bg-studio min-h-[350px] h-[600px]')}>{BlockPreview}</div>
    </div>
  )
}
