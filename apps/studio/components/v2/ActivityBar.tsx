'use client'

import { useProjectLintsQuery } from 'data/lint/lint-query'
import { ChartArea, Home, Plug, Settings, Table2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { useV2Params } from '@/app/v2/V2ParamsContext'

const AccountNav = dynamic(() => import('./Navigation/AccountNav').then((m) => m.AccountNav), {
  ssr: false,
})

export type ActivityId = 'home' | 'data' | 'obs' | 'settings'
interface ActivityBarProps {
  side: 'left' | 'right'
  activeId: string | null
  onSelect?: (id: string) => void
  items: Array<{
    id: string
    icon: React.ReactNode
    label: string
    badge?: boolean
    href?: string
    separatorAfter?: boolean
  }>
  /** For right bar, tooltips show on the left of the icon */
  tooltipSide?: 'left' | 'right'
  bottomContent?: React.ReactNode
}

export function ActivityBar({
  side,
  activeId,
  onSelect,
  items,
  tooltipSide = 'right',
  bottomContent,
}: ActivityBarProps) {
  return (
    <aside
      className={cn(
        'w-11 flex flex-col shrink-0 border-border bg-dash-sidebar',
        side === 'left' && 'border-r',
        side === 'right' && 'border-l'
      )}
    >
      <div className="flex flex-col flex-1 gap-1 p-1.5">
        {items.map((item) => {
          const isActive = activeId === item.id
          const content = (
            <Tooltip key={item.id} delayDuration={0}>
              <TooltipTrigger asChild>
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn(
                      'relative flex items-center justify-center w-full aspect-square rounded-lg shrink-0 text-foreground-lighter hover:text-foreground hover:bg-sidebar-accent',
                      isActive && 'bg-sidebar-accent text-foreground',
                      side === 'left' && isActive && 'border-1 border-foreground',
                      side === 'right' && isActive && 'border-1 border-foreground'
                    )}
                  >
                    <span className="relative">
                      {item.icon}
                      {item.badge && (
                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive" />
                      )}
                    </span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelect?.(item.id)}
                    className={cn(
                      'relative flex items-center justify-center w-full aspect-square rounded-lg shrink-0 text-foreground-lighter hover:text-foreground hover:bg-sidebar-accent',
                      isActive && 'bg-sidebar-accent text-foreground',
                      side === 'left' && isActive && 'border-l-2 border-l-foreground',
                      side === 'right' && isActive && 'border-r-2 border-r-foreground'
                    )}
                  >
                    <span className="relative">
                      {item.icon}
                      {item.badge && (
                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500" />
                      )}
                    </span>
                  </button>
                )}
              </TooltipTrigger>
              <TooltipContent side={tooltipSide} className="text-xs px-2">
                {item.label}
              </TooltipContent>
            </Tooltip>
          )
          return (
            <div key={item.id} className="contents">
              {content}
              {item.separatorAfter && <div className="h-px w-full bg-border/80 my-1" />}
            </div>
          )
        })}
      </div>
      {bottomContent && <div className="mt-auto">{bottomContent}</div>}
    </aside>
  )
}

export function LeftActivityBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { projectRef, orgSlug } = useV2Params()

  const isHomeActive =
    Boolean(projectRef && orgSlug) &&
    pathname?.endsWith(`/${projectRef}`) &&
    !pathname?.includes('/data/') &&
    !pathname?.includes('/obs/') &&
    !pathname?.includes('/settings/')

  const activeId: ActivityId | null = isHomeActive
    ? 'home'
    : pathname?.includes('/data/')
      ? 'data'
      : pathname?.includes('/obs/')
        ? 'obs'
        : pathname?.includes('/settings/')
          ? 'settings'
          : null

  const { data: lints } = useProjectLintsQuery({ projectRef })
  const hasAdvisorWarnings = (lints?.length ?? 0) > 0

  const base = projectRef ? `/v2/project/${projectRef}` : '#'
  const homeBase = projectRef && orgSlug ? `/v2/project/${projectRef}` : '#'

  const searchString = searchParams?.toString() ?? ''
  const connectHref = useMemo(() => {
    if (!projectRef) return '#'
    const path = pathname ?? `/v2/project/${projectRef}`
    const params = new URLSearchParams(searchString)
    params.set('showConnect', 'true')
    return `${path}?${params.toString()}`
  }, [projectRef, pathname, searchString])

  return (
    <ActivityBar
      side="left"
      activeId={activeId}
      items={[
        {
          id: 'home',
          icon: <Home className="h-4 w-4" strokeWidth={1.5} />,
          label: 'Home',
          href: homeBase,
          separatorAfter: true,
        },
        {
          id: 'connect',
          icon: <Plug className="h-4 w-4 rotate-90" strokeWidth={1.5} />,
          label: 'Connect',
          href: connectHref,
        },
        {
          id: 'data',
          icon: <Table2 className="h-4 w-4" strokeWidth={1.5} />,
          label: 'Data',
          href: `${base}/data/tables`,
        },
        {
          id: 'obs',
          icon: <ChartArea className="h-4 w-4" strokeWidth={1.5} />,
          label: 'Observe',
          badge: hasAdvisorWarnings,
          href: `${base}/obs/advisors/security`,
        },
        {
          id: 'settings',
          icon: <Settings className="h-4 w-4" strokeWidth={1.5} />,
          label: 'Settings',
          href: `${base}/settings/general`,
        },
      ]}
      tooltipSide="right"
      bottomContent={
        <div className="p-1.5">
          <AccountNav />
        </div>
      }
    />
  )
}
