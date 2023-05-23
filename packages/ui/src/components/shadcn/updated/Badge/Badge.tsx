import * as React from 'react'
import { VariantProps, cva } from 'class-variance-authority'

import { cn } from './../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center border rounded-full px-2.5 py-0.5 text-xs font-normal transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        outline: 'text-foreground',
        brand: 'bg-brand-200 text-brand-1100 border border-brand-700',
        scale: 'bg-scale-200 text-scale-1100 border border-scale-700',
        tomato: `bg-tomato-200 text-tomato-1100 border border-tomato-700`,
        red: `bg-red-200 text-red-1100 border border-red-700`,
        crimson: `bg-crimson-200 text-crimson-1100 border border-crimson-700`,
        pink: `bg-pink-200 text-pink-1100 border border-pink-700`,
        purple: `bg-purple-200 text-purple-1100 border border-purple-700`,
        violet: `bg-violet-200 text-violet-1100 border border-violet-700`,
        indigo: `bg-indigo-200 text-indigo-1100 border border-indigo-700`,
        blue: `bg-blue-200 text-blue-1100 border border-blue-700`,
        green: `bg-green-200 text-green-1100 border border-green-700`,
        grass: `bg-grass-200 text-grass-1100 border border-grass-700`,
        orange: `bg-orange-200 text-orange-1100 border border-orange-700`,
        yellow: `bg-yellow-200 text-yellow-1100 border border-yellow-700`,
        amber: `bg-amber-200 text-amber-1100 border border-amber-700`,
        gold: `bg-gold-200 text-gold-1100 border border-gold-700`,
        gray: `bg-gray-200 text-gray-1100 border border-gray-700`,
        slate: `bg-slate-200 text-slate-1100 border border-slate-700`,
      },
      size: {
        large: 'px-3 py-0.5 rounded-full text-sm',
      },
    },
    defaultVariants: {
      variant: 'scale',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = ({ className, variant, size, ...props }: BadgeProps) => {
  return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
}

// Badge.displayName = 'Badge'

export { Badge }
