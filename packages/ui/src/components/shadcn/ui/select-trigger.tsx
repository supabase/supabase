'use client'

import { cva, type VariantProps } from 'class-variance-authority'

import { SIZE_VARIANTS, SIZE_VARIANTS_DEFAULT } from '../../../lib/constants'

export const selectTriggerVariants = cva(
  'flex w-full cursor-pointer items-center justify-between rounded-md border border-strong hover:border-control-hover bg-control-raised text-xs data-[placeholder]:text-foreground-lighter ring-border-control focus-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200 data-[state=open]:border-control-hover gap-2 [&>span]:truncate text-left',
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
