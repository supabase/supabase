'use client'

import { useEffect, useMemo, useState, type HTMLAttributes } from 'react'
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

/** Eight-way arrows used by Select 2026 TicketCta / glyph-engine frames. */
const FIELD_ARROWS = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'] as const

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

const arrowAt = (x: number, y: number, cols: number, rows: number) => {
  const dx = x - (cols - 1) / 2
  const dy = y - (rows - 1) / 2
  const index = (((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 2) % 8) + 8) % 8
  return FIELD_ARROWS[index]
}

type Select26FieldProps = HTMLAttributes<HTMLDivElement> & {
  cols?: number
  rows?: number
}

/**
 * Static crop of the Select 2026 TicketCtaSection arrow-field graphic.
 * Radiating eight-way arrows match the glyph-engine frame without its canvas runtime.
 */
export const Select26Field = ({ cols = 10, rows = 6, className, ...props }: Select26FieldProps) => {
  const cells = useMemo(() => {
    const next: string[] = []
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        next.push(arrowAt(x, y, cols, rows))
      }
    }
    return next
  }, [cols, rows])

  return (
    <div
      aria-hidden
      className={cn(styles.field, className)}
      style={{ gridTemplateColumns: `repeat(${cols}, 1.05em)` }}
      {...props}
    >
      {cells.map((glyph, index) => (
        <span key={index} className={styles.cell}>
          {glyph}
        </span>
      ))}
    </div>
  )
}
