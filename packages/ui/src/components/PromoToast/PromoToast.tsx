import { isBrowser } from 'common'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from 'ui'
import announcement from '../../layout/banners/data/Announcement.json'
import CountdownComponent from '../CountdownWidget/Countdown'
import PromoBg from './PromoBg'

const PromoToast = () => {
  const [visible, setVisible] = useState(true)
  const LWXLogo =
    'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lwx/assets/lwx_logo.svg?t=2023-11-22T17%3A45%3A52.077Z'

  if (!isBrowser) return null
  const handleHide = () => {
    setVisible(false)
    localStorage?.setItem('supabase-hide-promo-toast', 'true')
  }
  const shouldShowToast = isBrowser && localStorage?.getItem('supabase-hide-promo-toast') !== 'true'

  if (!visible || !shouldShowToast) {
    return null
  }

  return (
    <div className="grid gap-4 fixed z-50 bottom-8 right-8 w-[80vw] sm:w-[350px] bg-alternative-200 hover:bg-alternative transition-colors border border-default rounded p-6 shadow-lg overflow-hidden">
      <div className="relative z-10 text-foreground flex flex-col text-base uppercase tracking-[1px]">
        <div className="flex gap-1.5 items-center">
          <p>Launch Week</p>
          <Image src={LWXLogo} alt="Supabase Launch Week X Logo" width={14} height={14} />
        </div>
        <span className="font-mono text-sm">Dec 11-15 / 10am PT</span>
        <CountdownComponent date={new Date(announcement.launchDate)} showCard={false} />
      </div>

      <div className="relative z-10 flex items-center space-x-2">
        <Button asChild type="secondary">
          <Link target="_blank" rel="noreferrer" href="https://supabase.com/launch-week">
            Claim your ticket
          </Link>
        </Button>
        <Button type="default" onClick={handleHide}>
          Dismiss
        </Button>
      </div>
      <PromoBg className="absolute z-0 inset-0 w-full h-auto my-auto right-0 left-auto" />
    </div>
  )
}

export default PromoToast
