'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner } from 'sonner'
import { cn } from '../../../lib/utils'
import { buttonVariants } from './../../Button'
import { StatusIcon } from './../../StatusIcon'

type ToasterProps = React.ComponentProps<typeof Sonner>

const SonnerToaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      icons={{
        warning: <StatusIcon variant="warning" />,
        error: <StatusIcon variant="destructive" />,
        info: <StatusIcon variant="default" />,
      }}
      theme={theme as ToasterProps['theme']}
      className="toaster group"
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
        },
      }}
      {...props}
    />
  )
}

export { SonnerToaster }
