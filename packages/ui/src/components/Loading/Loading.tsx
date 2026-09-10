import { Loader2 } from 'lucide-react'
import React from 'react'

import { cn } from '../../lib/utils/cn'

interface Props {
  children: React.ReactNode
  active: boolean
  isFullHeight?: boolean
}
export default function Loading({ children, active, isFullHeight = false }: Props) {
  return (
    <div
      className={cn('relative', {
        'opacity-40': active,
        'h-full': isFullHeight,
      })}
    >
      <div
        className={cn('transition-opacity duration-300', {
          'h-full': isFullHeight,
        })}
      >
        {children}
      </div>
      {active && (
        <Loader2
          size={24}
          className="absolute text-foreground-lighter animate-spin inset-0 size-5 m-auto"
        />
      )}
    </div>
  )
}
