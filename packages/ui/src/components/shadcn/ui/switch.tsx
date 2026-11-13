'use client'

import { Switch as SwitchPrimitive } from '@base-ui/react/switch'
import { cva, VariantProps } from 'class-variance-authority'

import { cn } from '../../../lib/utils/cn'

export interface SwitchProps
  extends
    Omit<SwitchPrimitive.Root.Props, 'className' | 'nativeButton' | 'render'>,
    VariantProps<typeof switchRootVariants> {
  className?: string
}

const switchRootVariants = cva(
  'peer group/switch inline-flex shrink-0 cursor-pointer items-center rounded-full inset-ring inset-ring-black/10 transition-colors focus-ring data-disabled:cursor-not-allowed data-disabled:opacity-50 data-[checked]:bg-[var(--primary-bright-hover)] dark:data-[checked]:bg-primary-bright data-[unchecked]:bg-border-strong dark:data-[unchecked]:bg-border data-[unchecked]:inset-ring-border not-data-disabled:data-[unchecked]:active:bg-border-stronger dark:not-data-disabled:data-[unchecked]:active:bg-border-strong',
  {
    variants: {
      size: {
        small: 'h-4 w-7 p-0.5',
        medium: 'h-5 w-8.5 p-0.5',
        large: 'h-6 w-11 p-0.75',
      },
    },
    defaultVariants: {
      size: 'medium',
    },
  }
)

const switchThumbVariants = cva(
  'pointer-events-none block shrink-0 rounded-full bg-linear-to-b from-white to-neutral-100 shadow-lg data-[checked]:shadow-sm ring-0 inset-ring inset-ring-black/10 transition-[translate,width] duration-150 ease-[ease]',
  {
    variants: {
      size: {
        small:
          'size-3 group-not-data-disabled/switch:group-hover/switch:w-3.5 group-not-data-disabled/switch:group-active/switch:w-4 data-[checked]:translate-x-[calc(--spacing(6)-100%)]',
        medium:
          'size-4 group-not-data-disabled/switch:group-hover/switch:w-4.5 group-not-data-disabled/switch:group-active/switch:w-5 data-[checked]:translate-x-[calc(--spacing(7.5)-100%)]',
        large:
          'size-4.5 group-not-data-disabled/switch:group-hover/switch:w-5 group-not-data-disabled/switch:group-active/switch:w-5.5 data-[checked]:translate-x-[calc(--spacing(9.5)-100%)]',
      },
    },
    defaultVariants: {
      size: 'medium',
    },
  }
)

export const Switch = ({ className, size, ...props }: SwitchProps) => (
  <SwitchPrimitive.Root
    className={cn(switchRootVariants({ size }), className)}
    nativeButton
    render={<button type="button" />}
    {...props}
  >
    <SwitchPrimitive.Thumb className={switchThumbVariants({ size })} />
  </SwitchPrimitive.Root>
)
