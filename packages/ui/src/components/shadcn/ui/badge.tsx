import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@ui/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-opacity-10',
  {
    variants: {
      variant: {
        default: 'bg-surface-200 text-foreground-light border border-strong',
        brand: 'bg-brand-200 text-brand-primary border border-brand-400',
        secondary:
          'bg-secondary hover:bg-secondary/80 border-transparent text-secondary-foreground',
        destructive: 'bg-destructive-400 text-destructive border border-destructive-300',
        outline: 'bg-transparent text border border-foreground',
        scale: 'bg-background text-foreground-light border border-strong',
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
        small: 'px-2.5 py-0.5 text-xs',
        large: 'px-3 py-0.5 rounded-full text-sm',
      },
      dot: {
        true: '-ml-0.5 mr-1.5 h-2 w-2 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'small',
    },
  }
)
// const badgeVariants = cva(
//   'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-opacity-10',
//   {
//     variants: {
//       variant: {
//         size: {
//           large: 'px-3 py-0.5 rounded-full text-sm',
//         },
//         dot: '-ml-0.5 mr-1.5 h-2 w-2 rounded-full',
//         color: {
//           brand: 'bg-brand-200 text-brand-600 border border-brand-400',
//           scale: 'bg-background text-foreground-light border border-strong',
//           tomato: `bg-tomato-200 text-tomato-1100 border border-tomato-700`,
//           red: `bg-red-200 text-red-1100 border border-red-700`,
//           crimson: `bg-crimson-200 text-crimson-1100 border border-crimson-700`,
//           pink: `bg-pink-200 text-pink-1100 border border-pink-700`,
//           purple: `bg-purple-200 text-purple-1100 border border-purple-700`,
//           violet: `bg-violet-200 text-violet-1100 border border-violet-700`,
//           indigo: `bg-indigo-200 text-indigo-1100 border border-indigo-700`,
//           blue: `bg-blue-200 text-blue-1100 border border-blue-700`,
//           green: `bg-green-200 text-green-1100 border border-green-700`,
//           grass: `bg-grass-200 text-grass-1100 border border-grass-700`,
//           orange: `bg-orange-200 text-orange-1100 border border-orange-700`,
//           yellow: `bg-yellow-200 text-yellow-1100 border border-yellow-700`,
//           amber: `bg-amber-200 text-amber-1100 border border-amber-700`,
//           gold: `bg-gold-200 text-gold-1100 border border-gold-700`,
//           gray: `bg-gray-200 text-gray-1100 border border-gray-700`,
//           slate: `bg-slate-200 text-slate-1100 border border-slate-700`,
//         },
//       },
//     },
//   }
// )

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <svg className={badgeVariants({ dot })} fill="currentColor" viewBox="0 0 8 8">
          <circle cx="4" cy="4" r="3" />
        </svg>
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
