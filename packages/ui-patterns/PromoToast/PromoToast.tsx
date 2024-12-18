'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { cn } from 'ui/src/lib/utils/cn'
import { Button } from 'ui/src/components/Button/Button'
import { LOCAL_STORAGE_KEYS } from 'common'
import { useTheme } from 'next-themes'
import announcement from 'ui/src/layout/banners/data/Announcement.json'

const LW13BGDark =
  'https://xguihxuzqibwxjnimxev.supabase.co/storage/v1/object/public/images/launch-week/lw13/assets/lw13-bg-dark.png?t=2024-11-22T23%3A10%3A37.646Z'
const LW13BGLight =
  'https://xguihxuzqibwxjnimxev.supabase.co/storage/v1/object/public/images/launch-week/lw13/assets/lw13-bg-light.png?t=2024-11-22T23%3A10%3A37.646Z'

const PromoToast = () => {
  const [visible, setVisible] = useState(false)
  const { resolvedTheme } = useTheme()
  const bgImage = resolvedTheme?.includes('dark') ? LW13BGDark : LW13BGLight

  useEffect(() => {
    const shouldHide =
      !localStorage?.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT) ||
      localStorage?.getItem(LOCAL_STORAGE_KEYS.HIDE_PROMO_TOAST) === 'true'

    if (!shouldHide) {
      setVisible(true)
    }
  }, [])

  const handleHide = () => {
    setVisible(false)
    localStorage?.setItem(LOCAL_STORAGE_KEYS.HIDE_PROMO_TOAST, 'true')
  }

  if (!visible) return null

  return (
    <div
      className={cn(
        'opacity-0 translate-y-3 transition-all grid gap-2 fixed z-50 bottom-4 right-4 sm:bottom-8 sm:right-8 w-[calc(100vw-2rem)] sm:w-[320px] bg-alternative hover:bg-alternative border border-default rounded p-6 shadow-lg overflow-hidden',
        visible && 'opacity-100 translate-y-0'
      )}
    >
      <div className="relative z-10 text-foreground-lighter leading-3 flex flex-col font-mono uppercase tracking-wide w-full text-xs">
        <div className="text-foreground uppercase tracking-wider text-lg -mb-1">Launch Week 13</div>
        <p className="text-foreground-lighter uppercase tracking-wider text-xl md:text-lg leading-snug">
          2—6 Dec
        </p>
      </div>
      <div className="relative z-10 text-foreground-lighter flex flex-col text-sm uppercase font-mono tracking-widest w-full -mt-1">
        A week of new features
      </div>

      <div className="relative z-10 flex items-center space-x-2 mt-2">
        <Button asChild type="secondary">
          <Link target="_blank" rel="noreferrer" href={`https://supabase.com${announcement.link}`}>
            Learn more
          </Link>
        </Button>
        <Button type="default" onClick={handleHide}>
          Dismiss
        </Button>
      </div>
      <Image
        src={bgImage}
        alt=""
        fill
        sizes="100%"
        quality={100}
        aria-hidden
        className="absolute not-sr-only object-cover z-0 inset-0 w-full h-auto"
      />
    </div>
  )
}

export default PromoToast
