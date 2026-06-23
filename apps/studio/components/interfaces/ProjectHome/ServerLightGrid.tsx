import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from 'ui'

const DEFAULT_ROWS = 4
const DEFAULT_COLS = 6
const MIN_COLS = 6
const TARGET_CELL_WIDTH_PX = 20

const ServerLightCell = memo(function ServerLightCell({
  index,
  cols,
  rows,
  isActive,
  showActiveGlow = true,
}: {
  index: number
  cols: number
  rows: number
  isActive: boolean
  showActiveGlow?: boolean
}) {
  const row = Math.floor(index / cols)
  const col = index % cols

  return (
    <div
      className={cn(
        'flex items-center justify-center',
        col < cols - 1 && 'border-r border-dotted border-foreground/10',
        row < rows - 1 && 'border-b border-dotted border-foreground/10'
      )}
    >
      <span
        className={cn(
          'block h-1 w-1 rounded-full motion-safe:transition-all motion-safe:duration-150',
          isActive
            ? showActiveGlow
              ? 'bg-brand-500 shadow-[0_0_6px_1px] shadow-brand-500/50'
              : 'bg-brand-500'
            : 'bg-foreground/15'
        )}
      />
    </div>
  )
})

function randomDelay() {
  return 400 + Math.random() * 1400
}

function randomOnDuration() {
  return 200 + Math.random() * 800
}

function getColsForWidth(width: number, minCols: number) {
  return Math.max(minCols, Math.floor(width / TARGET_CELL_WIDTH_PX))
}

interface ServerLightGridProps {
  className?: string
  rows?: number
  cols?: number
  minCols?: number
  animated?: boolean
  showActiveGlow?: boolean
}

export function ServerLightGrid({
  className,
  rows = DEFAULT_ROWS,
  cols: fixedCols,
  minCols = MIN_COLS,
  animated = true,
  showActiveGlow = true,
}: ServerLightGridProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cols, setCols] = useState(fixedCols ?? DEFAULT_COLS)
  const [active, setActive] = useState<Set<number>>(() => new Set())
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    if (fixedCols !== undefined) {
      setCols(fixedCols)
      return
    }

    const container = containerRef.current
    if (!container) return

    const updateCols = (width: number) => {
      setCols(getColsForWidth(width, minCols))
    }

    updateCols(container.getBoundingClientRect().width)

    const resizeObserver = new ResizeObserver(([entry]) => {
      updateCols(entry.contentRect.width)
    })

    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [fixedCols, minCols])

  const total = rows * cols

  useEffect(() => {
    const timerMap = timers.current
    timerMap.forEach(clearTimeout)
    timerMap.clear()
    setActive(new Set())

    if (!animated) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

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

    for (let i = 0; i < total; i++) {
      scheduleBlink(i)
    }

    return () => {
      timerMap.forEach(clearTimeout)
      timerMap.clear()
    }
  }, [animated, total])

  const gridStyle = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
    }),
    [cols, rows]
  )

  const cells = useMemo(
    () =>
      Array.from({ length: total }, (_, i) => (
        <ServerLightCell
          key={i}
          index={i}
          cols={cols}
          rows={rows}
          isActive={active.has(i)}
          showActiveGlow={showActiveGlow}
        />
      )),
    [active, cols, rows, showActiveGlow, total]
  )

  return (
    <div ref={containerRef} className={cn('grid h-full w-full', className)} style={gridStyle}>
      {cells}
    </div>
  )
}
