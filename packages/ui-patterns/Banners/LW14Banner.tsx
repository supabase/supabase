'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import announcement from './data.json'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { Button } from 'ui/src/components/Button'
import { cn } from 'ui'

export function LW14Banner() {
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const isHomePage = pathname === '/'
  const isLaunchWeekPage =
    pathname === '/launch-week' || pathname?.includes('/launch-week/tickets/')
  const isLaunchWeekSection =
    (pathname?.includes('/launch-week') || pathname?.includes('/launch-week')) ?? false

  if (isLaunchWeekPage || isHomePage) return null

  return (
    <div
      style={{ fontFamily: 'Departure Mono, Source Code Pro, Office Code Pro, Menlo, monospace' }}
      className="relative w-full p-2 flex items-center group justify-center text-foreground bg-alternative border-b border-muted transition-colors overflow-hidden"
    >
      <div className="relative z-10 flex items-center justify-center">
        <div
          className={cn(
            'w-full flex gap-5 md:gap-10 items-center md:justify-center text-sm',
            isLaunchWeekSection && '!justify-center'
          )}
        >
          <p className="flex gap-1.5 items-center ">{announcement.text}</p>
          <div className="hidden lg:block text-foreground-lighter">Top 10 Launches</div>
          <Button size="tiny" type="default" className="px-2 !leading-none text-xs" asChild>
            <Link href={announcement.link}>{announcement.cta}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default LW14Banner
