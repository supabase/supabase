'use client'

import { cva, type VariantProps } from 'class-variance-authority'

import { SIZE_VARIANTS, SIZE_VARIANTS_DEFAULT } from '../../../lib/constants'
import { controlSurfaceShadows, raisedControlSurface } from '../../../lib/raised-control-surface'

export const selectTriggerVariants = cva(
  `flex w-full cursor-pointer items-center justify-between rounded-md text-xs data-[placeholder]:text-foreground-lighter ring-border-control focus-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200 gap-2 [&>span]:truncate text-left ${controlSurfaceShadows} ${raisedControlSurface}`,
  {
    variants: {
      size: {
        ...SIZE_VARIANTS,
      },
    },
    defaultVariants: {
      size: SIZE_VARIANTS_DEFAULT,
    },
  }
)

export type SelectTriggerVariantProps = VariantProps<typeof selectTriggerVariants>
