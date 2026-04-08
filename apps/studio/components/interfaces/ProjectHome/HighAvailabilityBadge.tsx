import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn, HoverCard, HoverCardContent, HoverCardTrigger, Separator } from 'ui'

import { ServerLightGrid } from './ServerLightGrid'
import { DOCS_URL } from '@/lib/constants'

interface HighAvailabilityBadgeProps {
  size?: 'default' | 'small'
}

export function HighAvailabilityBadge({ size = 'default' }: HighAvailabilityBadgeProps) {
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div
          className={cn(
            'inline-flex items-center justify-center rounded-md text-center font-mono uppercase',
            'cursor-default whitespace-nowrap font-medium tracking-[0.06em] text-[11px] leading-[1.1] px-[5.5px] py-[3px]',
            'transition-all',
            'border border-purple-700 dark:border-purple-600/50',
            'bg-purple-400 text-purple-1100 dark:bg-purple-100'
          )}
        >
          {size === 'small' ? 'HA' : 'High Availability'}
        </div>
      </HoverCardTrigger>
      <HoverCardContent side="bottom" align="start" className="w-72 overflow-hidden p-0">
        <div className="p-2 px-5 text-xs text-foreground-lighter">Multigres</div>
        <Separator />
        <div className="h-24 bg-surface-75">
          <ServerLightGrid />
        </div>
        <Separator />
        <div className="flex flex-col gap-1 p-3 px-5">
          <p className="text-sm text-foreground-light">
            A horizontally scalable Postgres architecture that supports highly-available and
            globally distributed deployments.
          </p>
          <Link
            href={`${DOCS_URL}/guides/deployment/high-availability`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs text-foreground-lighter transition-colors hover:text-foreground"
          >
            Read more
            <ArrowRight size={12} strokeWidth={1.5} />
          </Link>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
