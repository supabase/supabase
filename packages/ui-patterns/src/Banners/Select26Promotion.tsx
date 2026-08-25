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

const LOGO_ROWS = [
  { text: 'SUPABASE', tone: 'supabase' },
  { text: 'SELECT', tone: 'select' },
  { text: '26', tone: 'year' },
] as const

/** The Select 2026 site's canonical left-terminal logo, adapted without its canvas runtime. */
export const Select26Logo = ({ className }: { className?: string }) => (
  <span role="img" aria-label="Supabase Select 26" className={cn(styles.logo, className)}>
    {LOGO_ROWS.map(({ text, tone }) => (
      <span key={tone} className={cn(styles.logoRow, styles[tone])}>
        {text}
      </span>
    ))}
  </span>
)

const ARTWORK_ROWS = ['SUPABASE', 'SELECT 26'] as const

/** A static, low-cost crop of the 2026 site's FooterGridLogo. */
export const Select26Artwork = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div aria-hidden className={cn(styles.artwork, className)} {...props}>
    {ARTWORK_ROWS.map((row, index) => (
      <span key={row} className={styles.artworkRow} data-tone={index + 1}>
        {row}
      </span>
    ))}
  </div>
)
