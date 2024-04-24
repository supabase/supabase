import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from 'ui/src/components/shadcn/ui/hover-card'
import { ComputeBadge } from './ComputeBadge'
import { cn } from 'ui/src/lib/utils'
import { Separator } from 'ui/src/components/shadcn/ui/separator'
import { Button } from 'ui/src/components/Button'
import Link from 'next/link'

interface ComputeBadgeProps extends React.ComponentProps<typeof ComputeBadge> {
  /** Project ref, used for links */
  projectRef: string
  meta: any
}

export function ComputeBadgeWithHoverCard({
  infraComputeSize,
  projectRef,
  meta,
  ...props
}: ComputeBadgeProps) {
  if (!infraComputeSize) {
    return <></>
  }
  return (
    <HoverCard>
      <HoverCardTrigger className="group" asChild>
        <button>
          <ComputeBadge
            infraComputeSize={infraComputeSize}
            className={cn(
              'group-data-[state=open]:border-foreground-muted',
              'group-data-[state=open]:bg-surface-300'
            )}
            {...props}
          />
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="bottom" align="start" className="p-0 overflow-hidden">
        <div className="p-3 px-5 flex flex-row gap-3">
          <div className="">
            <ComputeBadge infraComputeSize={infraComputeSize} />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm text-foreground">
              {/* {meta?.cpu_cores ?? '?'}-core {cpuArchitecture}{' '} */}
            </p>
            <p className="text-sm text-foreground">
              {' '}
              {meta?.cpu_dedicated ? '(Dedicated)' : '(Shared)'}{' '}
            </p>

            <p className="text-sm">
              <span className="font-semibold text-brand">$39 </span>/ month{' '}
            </p>
          </div>
        </div>

        <Separator />
        <div className="p-3 px-5 text-sm flex flex-col gap-2 bg-studio">
          <p className="text-foreground">Unlock more compute</p>
          <p className="text-foreground-light">Scale your project up to 64 cores and 256 GB RAM.</p>
          <div>
            <Button type="alternative" asChild>
              <Link href={`/project/${projectRef}/settings/addons`}>Upgrade compute</Link>
            </Button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
