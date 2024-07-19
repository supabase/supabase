'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '../../../components/Button/Button'
import { cn } from '../../../lib/utils/cn'
import announcement from '../data/Announcement.json'

export function LW11CountdownBanner() {
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const isLaunchWeekPage = pathname === '/ga-week'
  const isLaunchWeekSection =
    (pathname?.includes('/launch-week') || pathname?.includes('/ga-week')) ?? false

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
          <Button size="tiny" type="default" className="px-2 !leading-none text-xs" asChild>
            <Link href="https://supabase.com/ga-week">Learn more</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default LW11CountdownBanner
