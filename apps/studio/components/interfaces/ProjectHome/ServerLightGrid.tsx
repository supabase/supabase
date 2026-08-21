import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from 'ui'

const ROWS = 4
const COLS = 6
const TOTAL = ROWS * COLS

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
          'block h-1 w-1 rounded-full motion-safe:transition-all motion-safe:duration-150',
          isActive ? 'bg-brand-500 shadow-[0_0_6px_1px] shadow-brand-500/50' : 'bg-foreground/15'
        )}
      />
    </div>
  )
})

const GRID_STYLE = {
  gridTemplateColumns: `repeat(${COLS}, 1fr)`,
  gridTemplateRows: `repeat(${ROWS}, 1fr)`,
} as const

const CELL_INDICES = Array.from({ length: TOTAL }, (_, i) => i)

function randomDelay() {
  return 400 + Math.random() * 1400
}

function randomOnDuration() {
  return 200 + Math.random() * 800
}

export function ServerLightGrid() {
  const [active, setActive] = useState<Set<number>>(() => new Set())
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

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
