import type { ReactNode } from 'react'
import { cn } from 'ui'

import { InterstitialLayout, SupabaseLogo } from '@/components/layouts/InterstitialLayout'

export const McpElicitationShell = ({
  title,
  subtitle,
  children,
}: {
  title: ReactNode
  subtitle: ReactNode
  children: ReactNode
}) => (
  <InterstitialLayout
    logo={<SupabaseLogo />}
    title={title}
    description={subtitle}
    descriptionClassName="text-foreground-light"
  >
    <div className="flex flex-col gap-6 px-6 pb-6">{children}</div>
  </InterstitialLayout>
)

export const McpElicitationFooter = ({
  children,
  align = 'center',
}: {
  children: ReactNode
  align?: 'center' | 'start'
}) => (
  <p
    className={cn(
      'text-xs text-foreground-light',
      align === 'center' ? 'text-center' : 'text-left'
    )}
  >
    {children}
  </p>
)
