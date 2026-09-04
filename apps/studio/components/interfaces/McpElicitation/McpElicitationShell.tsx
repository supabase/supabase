import { ShieldAlert } from 'lucide-react'
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

export const McpElicitationTrustLine = ({ children }: { children: ReactNode }) => (
  <p className="flex items-start gap-2.5 rounded-md border border-warning-400 bg-warning-200 px-3 py-2.5 text-xs text-foreground">
    <ShieldAlert size={14} className="mt-px shrink-0 text-warning-600" aria-hidden />
    <span className="text-balance">{children}</span>
  </p>
)
