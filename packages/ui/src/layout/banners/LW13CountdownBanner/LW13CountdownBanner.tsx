'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '../../../components/Button/Button'
import { cn } from '../../../lib/utils/cn'
import announcement from '../data/Announcement.json'
import Image from 'next/image'
import { useTheme } from 'next-themes'
// import Countdown from './Countdown'

const LW13BGDark =
  'https://xguihxuzqibwxjnimxev.supabase.co/storage/v1/object/public/images/launch-week/lw13/assets/lw13-banner-dark.png?t=2024-11-22T23%3A10%3A37.646Z'
const LW13BGLight =
  'https://xguihxuzqibwxjnimxev.supabase.co/storage/v1/object/public/images/launch-week/lw13/assets/lw13-banner-light.png?t=2024-11-22T23%3A10%3A37.646Z'

export function LW13CountdownBanner() {
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const bgImage = resolvedTheme?.includes('dark') ? LW13BGDark : LW13BGLight
  const isHomePage = pathname === '/'
  const isLaunchWeekPage =
    pathname === '/launch-week' || pathname?.includes('/launch-week/tickets/')
  const isLaunchWeekSection =
    (pathname?.includes('/launch-week') || pathname?.includes('/launch-week')) ?? false

  if (isLaunchWeekPage || isHomePage) return null

  return (
    <div className="relative w-full p-2 flex items-center group justify-center text-foreground bg-alternative border-b border-muted transition-colors overflow-hidden">
      <div className="relative z-10 flex items-center justify-center">
        <div
          className={cn(
            'w-full flex gap-5 md:gap-10 items-center md:justify-center text-sm',
            isLaunchWeekSection && '!justify-center'
          )}
        >
          <p className="flex gap-1.5 items-center">{announcement.text}</p>
          <div className="hidden sm:block text-foreground-lighter">A week of new features</div>
          <Button size="tiny" type="default" className="px-2 !leading-none text-xs" asChild>
            <Link href={announcement.link}>{announcement.cta}</Link>
          </Button>
        </div>
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

export default LW13CountdownBanner
