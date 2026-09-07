import type { ReactNode } from 'react'
import { cn, Skeleton } from 'ui'

import { InterstitialLayout, SupabaseLogo } from '@/components/layouts/InterstitialLayout'

export const InterstitialShell = ({
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

export const InterstitialShellSkeleton = ({ children }: { children: ReactNode }) => (
  <InterstitialShell
    title={<Skeleton className="h-[18px] w-40" />}
    subtitle={
      <div className="flex flex-col items-center gap-1.5">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>
    }
  >
    {children}
  </InterstitialShell>
)

export const InterstitialFooter = ({
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
