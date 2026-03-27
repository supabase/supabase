import { DOCS_URL } from 'lib/constants'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { cn, HoverCard, HoverCardContent, HoverCardTrigger, Separator } from 'ui'

const ROWS = 4
const COLS = 6
const TOTAL = ROWS * COLS

function randomDelay() {
  return 400 + Math.random() * 1400
}

function randomOnDuration() {
  return 200 + Math.random() * 800
}

const GRID_STYLE = {
  gridTemplateColumns: `repeat(${COLS}, 1fr)`,
  gridTemplateRows: `repeat(${ROWS}, 1fr)`,
} as const

const ServerLightCell = memo(function ServerLightCell({
  index,
  isActive,
}: {
  index: number
  isActive: boolean
}) {
  const row = Math.floor(index / COLS)
  const col = index % COLS

  return (
    <div
      className={cn(
        'flex items-center justify-center',
        col < COLS - 1 && 'border-r border-dotted border-foreground/10',
        row < ROWS - 1 && 'border-b border-dotted border-foreground/10'
      )}
    >
      <span
        className={cn(
          'block h-1 w-1 rounded-full transition-all duration-150',
          isActive ? 'bg-brand-500 shadow-[0_0_6px_1px] shadow-brand-500/50' : 'bg-foreground/15'
        )}
      />
    </div>
  )
})

const CELL_INDICES = Array.from({ length: TOTAL }, (_, i) => i)

function ServerLightGrid() {
  const [active, setActive] = useState<Set<number>>(() => new Set())
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    const timerMap = timers.current

    function scheduleBlink(index: number) {
      const offDelay = randomDelay()
      const timer = setTimeout(() => {
        setActive((prev) => {
          const next = new Set(prev)
          next.add(index)
          return next
        })

        const onDuration = randomOnDuration()
        const offTimer = setTimeout(() => {
          setActive((prev) => {
            const next = new Set(prev)
            next.delete(index)
            return next
          })
          scheduleBlink(index)
        }, onDuration)

        timerMap.set(index, offTimer)
      }, offDelay)

      timerMap.set(index, timer)
    }

    for (let i = 0; i < TOTAL; i++) {
      scheduleBlink(i)
    }

    return () => {
      timerMap.forEach(clearTimeout)
      timerMap.clear()
    }
  }, [])

  const cells = useMemo(
    () => CELL_INDICES.map((i) => <ServerLightCell key={i} index={i} isActive={active.has(i)} />),
    [active]
  )

  return (
    <div className="grid h-full w-full" style={GRID_STYLE}>
      {cells}
    </div>
  )
}

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
