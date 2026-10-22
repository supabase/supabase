'use client'

import { useState } from 'react'
import { Button, DitheredSkeleton, DitheredSkeletonLite } from 'ui'

const CELLS = Array.from({ length: 120 })

export default function DitheredSkeletonLiteStress() {
  const [variant, setVariant] = useState<'canvas' | 'lite'>('lite')
  const Component = variant === 'lite' ? DitheredSkeletonLite : DitheredSkeleton

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex gap-2">
        <Button
          variant={variant === 'lite' ? 'primary' : 'default'}
          onClick={() => setVariant('lite')}
        >
          Lite
        </Button>
        <Button
          variant={variant === 'canvas' ? 'primary' : 'default'}
          onClick={() => setVariant('canvas')}
        >
          Canvas
        </Button>
      </div>
      <Component key={variant} className="h-64 w-full rounded-lg" />
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
        {CELLS.map((_, index) => (
          <Component key={`${variant}-${index}`} className="h-4" />
        ))}
      </div>
    </div>
  )
}
