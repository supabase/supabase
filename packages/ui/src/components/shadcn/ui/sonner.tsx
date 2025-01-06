'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner } from 'sonner'

import { cn } from '../../../lib/utils'
import { buttonVariants } from '../../Button'
import { StatusIcon } from './../../StatusIcon'

export const SONNER_DEFAULT_DURATION = 4000

type ToasterProps = React.ComponentProps<typeof Sonner>

const SonnerToaster = ({ toastOptions, ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      icons={{
        warning: <StatusIcon variant="warning" />,
        error: <StatusIcon variant="destructive" />,
        info: <StatusIcon variant="default" />,
      }}
      theme={theme as ToasterProps['theme']}
      // pointer-events-auto is needed to fix the toast when above radix modals. Set the width to 420px to fix the toast
      // progress component (bottom row rendered in two lines).
      className="toaster group pointer-events-auto"
      // fontFamily: 'inherit' is needed to use the same font as the rest of the app
      style={{ fontFamily: 'inherit' }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: cn(
            'group',
            'toast',
            'w-full',
            'rounded-md',
            'py-3',
            'px-5',
            'flex',
            'gap-2',
            'items-start',
            'font-normal',
            'text-sm',
            'group-[.toaster]:bg-overlay group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-overlay group-[.toaster]:shadow-lg'
          ),
          icon: 'mt-0.5',
          title: '!font-normal',
          description:
            'text-xs group-[.toast]:text-foreground-lighter transition-opacity group-data-[expanded=false]:opacity-0 group-data-[front=true]:!opacity-100',
          actionButton: cn('block', buttonVariants({ type: 'primary', size: 'tiny' })),
          cancelButton: cn('block', buttonVariants({ type: 'default', size: 'tiny' })),
          // success: 'group toast group-[.toaster]:!bg-brand-200 group-[.toaster]:border-brand-500',
          warning:
            'group toast group-[.toaster]:!bg-warning-200 group-[.toaster]:!border-warning-500',
          error:
            'group toast group-[.toaster]:!bg-destructive-200 group-[.toaster]:!border-destructive-500',
          closeButton: cn(
            // unset all styles set from sonner
            'absolute right-2 top-2 rounded-md text-foreground/50 opacity-0 transition-opacity',
            'hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100',
            'group-[.destructive]:text-destructive-300 group-[.destructive]:hover:text-destructive-50',
            'group-[.destructive]:focus:ring-destructive-400 group-[.destructive]:focus:ring-offset-destructive-600',
            'left-auto transform-none bg-transparent border-0 border-transparent hover:!bg-transparent hover:border-transparent'
          ),
          content: 'grow',
          //group-[.toaster]:bg-overlay group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-overlay
        },
        duration: SONNER_DEFAULT_DURATION,
        closeButton: true,
        ...toastOptions,
      }}
      cn={cn}
      {...props}
    />
  )
}

export { SonnerToaster }
