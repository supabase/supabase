'use client'

import { Toaster as Sonner } from 'sonner'

import { cn } from '../../../lib/utils'
import { buttonVariants } from '../../Button'
import { StatusIcon } from './../../StatusIcon'

export const SONNER_DEFAULT_DURATION = Infinity

type ToasterProps = React.ComponentProps<typeof Sonner> & { theme: 'light' | 'dark' | 'system' }

const SonnerToaster = ({ toastOptions, ...props }: ToasterProps) => {
  return (
    <Sonner
      icons={{
        warning: <StatusIcon variant="warning" />,
        error: <StatusIcon variant="destructive" />,
        info: <StatusIcon variant="default" />,
      }}
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
            'py-3!',
            'px-3!',
            'flex',
            'gap-2',
            'items-center',
            'font-normal!',
            'text-sm!',
            'data-[expanded=false]:overflow-hidden',
            'group-[.toaster]:bg-overlay group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-overlay group-[.toaster]:shadow-lg'
          ),
          icon: 'self-start',
          title: 'font-normal!',
          description:
            'text-xs! group-[.toast]:!text-foreground-lighter transition-opacity group-data-[expanded=false]:opacity-0 group-data-[front=true]:opacity-100!',
          actionButton: cn('block', buttonVariants({ variant: 'primary', size: 'tiny' })),
          cancelButton: cn('block', buttonVariants({ variant: 'default', size: 'tiny' })),
          // success: 'group toast group-[.toaster]:!bg-brand-200 group-[.toaster]:border-brand-500',
          warning:
            'group toast group-[.toaster]:!bg-warning-200 group-[.toaster]:!border-warning-500',
          error:
            'group toast group-[.toaster]:!bg-destructive-200 group-[.toaster]:!border-destructive-500',
          closeButton: cn(
            // unset all styles set from sonner
            'absolute -left-2 -top-2 size-6 flex items-center justify-center rounded-full text-foreground bg-overlay! opacity-0 transition-opacity',
            'border transform-none',
            'focus-visible:opacity-100 focus-ring group-hover:opacity-100',
            'group-data-[type="error"]:text-destructive! group-data-[type="error"]:border-destructive-500!',
            'group-data-[type="error"]:focus-visible:ring-destructive-400! group-data-[type="error"]:focus-visible:ring-offset-destructive-600!',
            'group-data-[type="warning"]:text-warning! group-data-[type="warning"]:border-warning-500!',
            'group-data-[type="warning"]:focus-visible:ring-warning-400! group-data-[type="warning"]:focus-visible:ring-offset-warning-600!'
          ),
          content: 'grow',
        },
        duration: SONNER_DEFAULT_DURATION,
        closeButton: true,
        ...toastOptions,
      }}
      {...props}
    />
  )
}

export { SonnerToaster }
