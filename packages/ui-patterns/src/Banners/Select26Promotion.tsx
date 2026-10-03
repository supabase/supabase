'use client'

import { useEffect, useMemo, useRef, useState, type HTMLAttributes } from 'react'
import { cn } from 'ui'

import styles from './Select26Promotion.module.css'

export const SELECT_26_URL = 'https://select.supabase.com/'
/** Studio Banner Stack card title. */
export const SELECT_26_TITLE = 'Supabase Select 2026'
/** www announcement banner copy. */
export const SELECT_26_MESSAGE = 'Supabase Select 2026 is coming October 2'
export const SELECT_26_DESCRIPTION =
  'A curated day of talks by the industry’s best builders. Join us on October 2nd in San Francisco.'
export const SELECT_26_CTA = 'Apply to attend'
export const SELECT_26_LIVESTREAM_DESCRIPTION =
  'Keynote, main stage, and build stage, streamed all day.'
export const SELECT_26_LIVESTREAM_CTA = 'Watch the livestream'
export const SELECT_26_LIVESTREAM_STUDIO_CTA = 'Watch livestream'
export const SELECT_26_LIVESTREAM_START = '2026-10-02T08:00:00-07:00'
export const SELECT_26_EXPIRY = '2026-10-02T17:30:00-07:00'
export const SELECT_26_WWW_DISMISSAL_KEY = 'announcement_select_26_08'
export const SELECT_26_STUDIO_DISMISSAL_KEY = 'select-2026-promotion-dismissed'
export const SELECT_26_LIVESTREAM_WWW_DISMISSAL_KEY = 'announcement_select_26_livestream'
export const SELECT_26_LIVESTREAM_STUDIO_DISMISSAL_KEY = 'select-2026-livestream-dismissed'

const SELECT_26_LIVESTREAM_START_MS = new Date(SELECT_26_LIVESTREAM_START).getTime()
const SELECT_26_EXPIRY_MS = new Date(SELECT_26_EXPIRY).getTime()
const MAX_TIMEOUT_MS = 2_147_483_647

/** Mirrored bracket vocabulary from Select 2026 glyph-engine `brackets` / socials exports. */
const OPEN_BRACKETS = ['‹', '{', '[', '('] as const
const CLOSE_BRACKETS = ['›', '}', ']', ')'] as const

/**
 * Radial sweep angular speed (rad / ms). Glyph-engine radar uses 0.004;
 * banners run slower so the beam reads without feeling frantic.
 */
const SWEEP_SPEED = 0.00055
/** Bracket face step period (ms), matching glyph-engine `bracketFace`. */
const BRACKET_STEP_MS = 170
/** Stepped paint rate — closer to glyph-engine `step` tween than 60fps React. */
const FRAME_INTERVAL_MS = 70

const positiveModulo = (value: number, modulo: number) => ((value % modulo) + modulo) % modulo

export type Select26PromotionPhase = 'waitlist' | 'livestream' | 'ended'

export const getSelect26PromotionPhase = (now = Date.now()): Select26PromotionPhase => {
  if (now < SELECT_26_LIVESTREAM_START_MS) return 'waitlist'
  if (now < SELECT_26_EXPIRY_MS) return 'livestream'
  return 'ended'
}

export const useSelect26PromotionPhase = () => {
  const [phase, setPhase] = useState<Select26PromotionPhase>(() => getSelect26PromotionPhase())

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const refreshPhase = () => {
      clearTimeout(timeoutId)
      const now = Date.now()
      const currentPhase = getSelect26PromotionPhase(now)
      setPhase(currentPhase)
      let nextBoundary: number | null = null
      if (currentPhase === 'waitlist') nextBoundary = SELECT_26_LIVESTREAM_START_MS
      if (currentPhase === 'livestream') nextBoundary = SELECT_26_EXPIRY_MS
      if (nextBoundary !== null) {
        timeoutId = setTimeout(refreshPhase, Math.min(nextBoundary - now, MAX_TIMEOUT_MS))
      }
    }
    const onVisibilityChange = () => {
      if (!document.hidden) refreshPhase()
    }
    refreshPhase()
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', refreshPhase)
    window.addEventListener('pageshow', refreshPhase)
    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', refreshPhase)
      window.removeEventListener('pageshow', refreshPhase)
    }
  }, [])

  return phase
}

type FieldCell = {
  ch: string
  /** Palette band 0–4 around the sweep. */
  band: number
  /** Beam proximity 0–1 (radar falloff). */
  weight: number
}

const cellAt = (
  x: number,
  y: number,
  cols: number,
  rows: number,
  timeMs: number,
  mirror = false
): FieldCell => {
  const cx = (cols - 1) / 2
  const cy = (rows - 1) / 2
  const nx = x - cx
  const ny = y - cy
  const angle = Math.atan2(ny, nx)
  const sweep = positiveModulo(timeMs * SWEEP_SPEED, Math.PI * 2)

  const step = Math.floor(timeMs / BRACKET_STEP_MS + y * 1.7 + Math.abs(nx) * 0.8)
  const idx = positiveModulo(step, OPEN_BRACKETS.length)
  const onLeft = mirror ? x > cx : x <= cx
  const ch = onLeft ? OPEN_BRACKETS[idx] : CLOSE_BRACKETS[idx]

  const hue = positiveModulo(angle - sweep, Math.PI * 2) / (Math.PI * 2)
  const band = Math.min(4, Math.floor(hue * 5))

  const distance = Math.min(
    positiveModulo(angle - sweep, Math.PI * 2),
    positiveModulo(sweep - angle, Math.PI * 2)
  )
  // Same thresholds as glyph-engine `radarFace`, with a readable off-beam field.
  const weight = distance < 0.16 ? 1 : distance < 0.42 ? 0.85 : distance < 0.78 ? 0.55 : 0.28

  return { ch, band, weight }
}

type Select26FieldProps = HTMLAttributes<HTMLDivElement> & {
  cols?: number
  rows?: number
  /** Per-row column counts; defaults to `cols` for every row. */
  rowWidths?: number[]
  /** Which edge shorter rows hug when widths vary. */
  rowAlign?: 'start' | 'end'
  /** Mirror bracket glyphs (for right-hand fields; prefer over CSS scale-x). */
  mirror?: boolean
}

/**
 * Animated Radial sweep: mirrored brackets with rotating colour bands and
 * radar beam falloff. Stepped updates mirror the Select glyph-engine without
 * shipping its canvas runtime.
 */
/**
 * One shared, throttled rAF loop for every mounted field, so multiple fields
 * (e.g. the mirrored www pair) paint in the same frame instead of each
 * running its own loop.
 */
type FieldPainter = (timeMs: number) => void
const fieldPainters = new Set<FieldPainter>()
let fieldRaf = 0
let fieldLastPaint = 0
let fieldStarted = 0

const fieldTick = (now: number) => {
  if (now - fieldLastPaint >= FRAME_INTERVAL_MS) {
    fieldLastPaint = now
    const timeMs = now - fieldStarted
    fieldPainters.forEach((paint) => paint(timeMs))
  }
  fieldRaf = fieldPainters.size > 0 ? requestAnimationFrame(fieldTick) : 0
}

const subscribeFieldPainter = (paint: FieldPainter) => {
  fieldPainters.add(paint)
  if (!fieldRaf) {
    if (!fieldStarted) fieldStarted = performance.now()
    fieldRaf = requestAnimationFrame(fieldTick)
  }
  return () => {
    fieldPainters.delete(paint)
    if (fieldPainters.size === 0 && fieldRaf) {
      cancelAnimationFrame(fieldRaf)
      fieldRaf = 0
    }
  }
}

export const Select26Field = ({
  cols = 10,
  rows = 6,
  rowWidths,
  rowAlign = 'start',
  mirror = false,
  className,
  ...props
}: Select26FieldProps) => {
  const rootRef = useRef<HTMLDivElement>(null)

  const widths = useMemo(() => {
    if (rowWidths) return rowWidths
    return Array.from({ length: rows }, () => cols)
  }, [rowWidths, rows, cols])
  const fieldRows = widths.length

  // Static first frame for SSR / reduced motion; animation then mutates the
  // existing spans directly instead of re-rendering through React.
  const initialCells = useMemo(
    () =>
      widths.map((rowCols, y) =>
        Array.from({ length: rowCols }, (_, x) => cellAt(x, y, rowCols, fieldRows, 0, mirror))
      ),
    [widths, fieldRows, mirror]
  )

  useEffect(() => {
    const node = rootRef.current
    if (!node) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const spans = Array.from(node.querySelectorAll<HTMLSpanElement>('[data-cell]'))
    const coords = widths.flatMap((rowCols, y) => Array.from({ length: rowCols }, (_, x) => [x, y]))
    const previous = initialCells.flat()

    const paint: FieldPainter = (timeMs) => {
      for (let i = 0; i < spans.length; i++) {
        const [x, y] = coords[i]
        const next = cellAt(x, y, widths[y], fieldRows, timeMs, mirror)
        const prev = previous[i]
        const span = spans[i]
        if (next.ch !== prev.ch) span.textContent = next.ch
        if (next.band !== prev.band) span.dataset.band = String(next.band)
        if (next.weight !== prev.weight) span.style.opacity = String(next.weight)
        previous[i] = next
      }
    }

    let unsubscribe: (() => void) | undefined
    const start = () => {
      if (!unsubscribe) unsubscribe = subscribeFieldPainter(paint)
    }
    const stop = () => {
      unsubscribe?.()
      unsubscribe = undefined
    }

    // Only animate while on screen (also covers `display: none` breakpoints).
    if (typeof IntersectionObserver === 'undefined') {
      start()
      return stop
    }
    const observer = new IntersectionObserver(
      ([entry]) => (entry?.isIntersecting ? start() : stop()),
      { rootMargin: '80px' }
    )
    observer.observe(node)
    return () => {
      observer.disconnect()
      stop()
    }
  }, [widths, fieldRows, mirror, initialCells])

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={cn(
        styles.field,
        rowAlign === 'end' ? styles.fieldAlignEnd : styles.fieldAlignStart,
        className
      )}
      {...props}
    >
      {initialCells.map((rowCells, y) => {
        const rowCols = widths[y]
        const cellWidth = 'calc(22 / 34 * 1em)'

        return (
          <div
            key={y}
            className={styles.row}
            style={{
              gridTemplateColumns: `repeat(${rowCols}, ${cellWidth})`,
              width: `calc(${rowCols} * 22 / 34 * 1em)`,
            }}
          >
            {rowCells.map((cell, index) => (
              <span
                key={index}
                data-cell
                className={styles.cell}
                data-band={cell.band}
                style={{ opacity: cell.weight }}
              >
                {cell.ch}
              </span>
            ))}
          </div>
        )
      })}
    </div>
  )
}
