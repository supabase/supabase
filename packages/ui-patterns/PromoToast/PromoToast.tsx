'use client'

// import Image from 'next/image'
import { hasConsented, LOCAL_STORAGE_KEYS } from 'common'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from 'ui/src/components/Button/Button'
import { cn } from 'ui/src/lib/utils/cn'
// import { useTheme } from 'next-themes'
import announcement from '../Banners/data.json'
import './styles.css'

const PromoToast = () => {
  const [visible, setVisible] = useState(false)
  // const { resolvedTheme } = useTheme()

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
      <div className="relative z-10 text-foreground-lighter uppercase flex flex-col text-sm w-full font-mono mb-2">
        <span className="mb-1">{announcement.text}</span>
        <p
          style={{
            fontFamily: 'Departure Mono, Source Code Pro, Office Code Pro, Menlo, monospace',
          }}
          className="relative z-10 text-foreground flex flex-col text-xl w-full leading-7"
        ></p>
      </div>

      <div className="relative z-10 flex items-center space-x-2">
        <Button asChild type="secondary">
          <Link target="_blank" rel="noreferrer" href={`https://supabase.com${announcement.link}`}>
            Learn more
          </Link>
        </Button>
        <Button type="default" onClick={handleHide}>
          Dismiss
        </Button>
      </div>
      {/* <Image
        src={}
        alt=""
        fill
        sizes="100%"
        quality={100}
        aria-hidden
        className="absolute not-sr-only object-cover z-0 inset-0 w-full h-auto"
      /> */}
    </div>
  )
}

export default PromoToast
