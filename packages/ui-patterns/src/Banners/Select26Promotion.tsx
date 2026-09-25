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
export const SELECT_26_EXPIRY = '2026-10-03T00:00:00-07:00'
export const SELECT_26_WWW_DISMISSAL_KEY = 'announcement_select_26_08'
export const SELECT_26_STUDIO_DISMISSAL_KEY = 'select-2026-promotion-dismissed'

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

export const isSelect26PromotionActive = (now = Date.now()) => now < SELECT_26_EXPIRY_MS

export const useSelect26PromotionActive = () => {
  const [isActive, setIsActive] = useState(() => isSelect26PromotionActive())

  useEffect(() => {
    if (!isActive) return
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const armExpiryTimer = () => {
      const remainingMs = SELECT_26_EXPIRY_MS - Date.now()
      if (remainingMs <= 0) {
        setIsActive(false)
        return
      }
      timeoutId = setTimeout(armExpiryTimer, Math.min(remainingMs, MAX_TIMEOUT_MS))
    }
    armExpiryTimer()
    return () => clearTimeout(timeoutId)
  }, [isActive])

  return isActive
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
  const [timeMs, setTimeMs] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const widths = useMemo(() => {
    if (rowWidths) return rowWidths
    return Array.from({ length: rows }, () => cols)
  }, [rowWidths, rows, cols])
  const fieldRows = widths.length

  useEffect(() => {
    const node = rootRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry?.isIntersecting ?? false),
      { rootMargin: '80px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    let raf = 0
    let lastPaint = 0
    const started = performance.now()

    const tick = (now: number) => {
      if (now - lastPaint >= FRAME_INTERVAL_MS) {
        lastPaint = now
        setTimeMs(now - started)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isVisible])

  const cellsByRow = useMemo(() => {
    return widths.map((rowCols, y) => {
      const rowCells: FieldCell[] = []
      for (let x = 0; x < rowCols; x++) {
        rowCells.push(cellAt(x, y, rowCols, fieldRows, timeMs, mirror))
      }
      return rowCells
    })
  }, [widths, fieldRows, timeMs, mirror])

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
      {cellsByRow.map((rowCells, y) => {
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
