import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button, cn } from 'ui'
import { LOCAL_STORAGE_KEYS } from 'common'
import { useTheme } from 'next-themes'

const LW11BGDark =
  'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lw11/assets/backgrounds/regular/001.png'
const LW11BGLight =
  'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lw11/assets/backgrounds/platinum/001.png'

const PromoToast = () => {
  const [visible, setVisible] = useState(false)
  const { resolvedTheme } = useTheme()
  const bgImage = resolvedTheme?.includes('dark') ? LW11BGDark : LW11BGLight

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
        'opacity-0 translate-y-3 transition-all grid gap-3 fixed z-50 bottom-4 right-4 sm:bottom-8 sm:right-8 w-[calc(100vw-2rem)] sm:w-[320px] bg-alternative hover:bg-alternative border border-default rounded p-6 shadow-lg overflow-hidden',
        visible && 'opacity-100 translate-y-0'
      )}
    >
      <div className="relative z-10 text-foreground-lighter flex flex-col text-sm w-full mb-2">
        <p className="text-foreground flex flex-col text-lg w-full leading-6 mb-1">
          General Availability Week
        </p>
        <span className="uppercase font-mono">Day 5</span>
      </div>

      <div className="relative z-10 flex items-center space-x-2">
        <Button asChild type="secondary">
          <Link target="_blank" rel="noreferrer" href="https://supabase.com/ga-week#day-5">
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
        aria-hidden
        className="absolute not-sr-only object-cover z-0 inset-0 w-full h-auto"
      />
    </div>
  )
}

export default PromoToast
