'use client'

import { usePathname } from 'next/navigation'
import { cn } from 'ui'

import { useV2Params } from '@/app/v2/V2ParamsContext'

import { DataTabBar } from './DataTabBar'
import { StaticTitle } from './StaticTitle'
import { V2EditorFooter } from './V2EditorFooter'

export function EditorFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { projectRef } = useV2Params()

  // Any /data route (including the chooser at /data with no further segment)
  const isDataActivity =
    Boolean(projectRef) && Boolean(pathname?.includes('/data/') || pathname?.endsWith('/data'))

  // Sub-routes deeper than /data (list + detail views) need overflow:hidden for grids
  const isDataSubRoute =
    Boolean(projectRef) &&
    Boolean(
      pathname?.includes('/data/tables') ||
      pathname?.includes('/data/functions') ||
      pathname?.includes('/data/triggers') ||
      pathname?.includes('/data/types') ||
      pathname?.includes('/data/roles') ||
      pathname?.includes('/data/extensions') ||
      pathname?.includes('/data/indexes') ||
      pathname?.includes('/data/publications') ||
      pathname?.includes('/data/users') ||
      pathname?.includes('/data/providers') ||
      pathname?.includes('/data/oauth-apps') ||
      pathname?.includes('/data/buckets') ||
      pathname?.includes('/data/edge-functions') ||
      pathname?.includes('/data/channels')
    )

  const isHome =
    Boolean(projectRef) &&
    pathname?.endsWith(`/${projectRef}`) &&
    !pathname?.includes('/data') &&
    !pathname?.includes('/obs/') &&
    !pathname?.includes('/settings/')

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-background">
      {!isDataActivity && !isHome && <StaticTitle />}
      {isDataActivity && <DataTabBar />}
      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col',
          isDataSubRoute ? 'overflow-hidden' : 'overflow-auto'
        )}
      >
        {children}
      </div>
      <V2EditorFooter />
    </div>
  )
}
