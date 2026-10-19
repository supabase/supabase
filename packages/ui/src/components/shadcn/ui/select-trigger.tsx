'use client'

import { cva, type VariantProps } from 'class-variance-authority'

import { SIZE_VARIANTS, SIZE_VARIANTS_DEFAULT } from '../../../lib/constants'
import { controlRadiusBySize } from '../../../lib/raised-control-surface'
import { cn } from '../../../lib/utils'

export const selectTriggerVariants = cva(
  cn(
    'flex w-full cursor-pointer items-center justify-between rounded-md border-0 text-xs data-[placeholder]:text-foreground-lighter ring-border-control focus-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200 gap-2 [&>span]:truncate text-left control-surface-shadows raised-control-surface',
    'aria-[invalid=true]:border aria-[invalid=true]:bg-destructive-200 aria-[invalid=true]:border-destructive-400 aria-[invalid=true]:hover:border-destructive aria-[invalid=true]:focus:border-destructive aria-[invalid=true]:focus-visible:border-destructive'
  ),
  {
    variants: {
      size: {
        tiny: `${SIZE_VARIANTS.tiny} ${controlRadiusBySize.tiny}`,
        small: `${SIZE_VARIANTS.small} ${controlRadiusBySize.small}`,
        medium: `${SIZE_VARIANTS.medium} ${controlRadiusBySize.medium}`,
        large: `${SIZE_VARIANTS.large} ${controlRadiusBySize.large}`,
        xlarge: `${SIZE_VARIANTS.xlarge} ${controlRadiusBySize.xlarge}`,
      },
    },
    defaultVariants: {
      size: SIZE_VARIANTS_DEFAULT,
    },
  }
)

export type SelectTriggerVariantProps = VariantProps<typeof selectTriggerVariants>
