'use client'

import { useState, type HTMLAttributes } from 'react'
import { Button, DitheredSkeleton, DitheredSkeletonGif, DitheredSkeletonLite } from 'ui'

const DitheredSkeletonGifWithoutShine = (props: HTMLAttributes<HTMLDivElement>) => (
  <DitheredSkeletonGif shine={false} {...props} />
)

const VARIANTS = {
  Canvas: DitheredSkeleton,
  Lite: DitheredSkeletonLite,
  GIF: DitheredSkeletonGif,
  'GIF, no shine': DitheredSkeletonGifWithoutShine,
}

type Variant = keyof typeof VARIANTS

const CELLS = Array.from({ length: 120 })

export default function DitheredSkeletonStress() {
  const [variant, setVariant] = useState<Variant>('Lite')
  const Component = VARIANTS[variant]

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex gap-2">
        {(Object.keys(VARIANTS) as Variant[]).map((name) => (
          <Button
            key={name}
            variant={variant === name ? 'primary' : 'default'}
            onClick={() => setVariant(name)}
          >
            {name}
          </Button>
        ))}
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
