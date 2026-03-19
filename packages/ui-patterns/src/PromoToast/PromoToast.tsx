'use client'

import { hasConsented, LOCAL_STORAGE_KEYS } from 'common'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from 'ui/src/components/Button/Button'
import { cn } from 'ui/src/lib/utils/cn'

import announcement from '../Banners/data.json'

import './styles.css'

const PromoToast = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const shouldHide =
      !hasConsented() || localStorage?.getItem(LOCAL_STORAGE_KEYS.HIDE_PROMO_TOAST) === 'true'

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
      <video
        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/launch-week/lw15/assets/lw15-galaxy.mp4`}
        autoPlay
        loop
        muted
        className="absolute w-full h-full inset-0 object-cover z-0"
        style={{
          opacity: 0.05,
        }}
        poster={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/launch-week/lw15/assets/lw15-galaxy.png`}
      />
      <div className="relative z-10 text-foreground-lighter uppercase flex flex-col text-sm w-full mb-2">
        <span className="mb-1">{announcement.text}</span>
        <p className="relative z-10 text-foreground flex flex-col text-xl w-full leading-7"></p>
      </div>

      <div className="relative z-10 flex items-center space-x-2">
        <Button asChild type="secondary">
          <Link target="_blank" rel="noreferrer" href={`https://supabase.com${announcement.link}`}>
            Claim your ticket
          </Link>
        </Button>
        <Button type="default" onClick={handleHide}>
          Dismiss
        </Button>
      </div>
    </div>
  )
}

export default PromoToast
