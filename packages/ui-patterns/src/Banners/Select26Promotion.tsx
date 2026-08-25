'use client'

import { useEffect, useState, type HTMLAttributes } from 'react'
import { cn } from 'ui'

import styles from './Select26Promotion.module.css'

export const SELECT_26_URL = 'https://select.supabase.com/'
export const SELECT_26_MESSAGE = 'Supabase Select 2026 is coming October 2.'
export const SELECT_26_CTA = 'Apply to attend today'
export const SELECT_26_EXPIRY = '2026-10-03T00:00:00-07:00'
export const SELECT_26_WWW_DISMISSAL_KEY = 'announcement_select_26_08'
export const SELECT_26_STUDIO_DISMISSAL_KEY = 'select-2026-promotion-dismissed'

const SELECT_26_EXPIRY_MS = new Date(SELECT_26_EXPIRY).getTime()
const MAX_TIMEOUT_MS = 2_147_483_647

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

const GLYPHS = {
  S: ['111', '100', '111', '001', '111'],
  E: ['111', '100', '110', '100', '111'],
  L: ['100', '100', '100', '100', '111'],
  C: ['111', '100', '100', '100', '111'],
  T: ['111', '010', '010', '010', '010'],
  2: ['111', '001', '111', '100', '111'],
  6: ['111', '100', '111', '101', '111'],
} as const

const WORD = ['S', 'E', 'L', 'E', 'C', 'T', '2', '6'] as const

export const Select26Mark = ({ className }: { className?: string }) => {
  const cell = 2
  const glyphWidth = 3 * cell
  const gap = cell
  const yearGap = cell * 2

  return (
    <svg
      role="img"
      aria-label="Supabase Select 2026"
      viewBox="0 0 68 10"
      className={cn('block h-auto w-full', className)}
      fill="currentColor"
    >
      {WORD.flatMap((character, characterIndex) => {
        const extraGap = characterIndex >= 6 ? yearGap : 0
        const xOffset = characterIndex * (glyphWidth + gap) + extraGap

        return GLYPHS[character].flatMap((row, rowIndex) =>
          [...row].map((value, columnIndex) =>
            value === '1' ? (
              <rect
                key={`${characterIndex}-${rowIndex}-${columnIndex}`}
                x={xOffset + columnIndex * cell}
                y={rowIndex * cell}
                width={cell}
                height={cell}
              />
            ) : null
          )
        )
      })}
    </svg>
  )
}

export const Select26Artwork = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    aria-hidden
    className={cn('pointer-events-none overflow-hidden', styles.artwork, className)}
    {...props}
  >
    <div className={cn('h-full w-1/2', styles.scan)} />
  </div>
)
