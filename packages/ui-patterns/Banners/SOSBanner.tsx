'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from 'ui/src/components/Button'

export function SOSBanner() {
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const isSurveyPage = pathname === '/state-of-startups'

  if (isHomePage || isSurveyPage) return null

  return (
    <div className="relative w-full p-2 flex items-center group justify-center text-foreground bg-alternative border-b border-muted transition-colors overflow-hidden">
      <div className="relative z-10 flex items-center justify-center">
        <div className="w-full flex gap-5 md:gap-10 items-center md:justify-center text-sm">
          <p className="flex gap-1.5 items-center text-brand font-mono uppercase tracking-widest text-sm">
            State of Startups 2025
          </p>
          <Button size="tiny" type="default" className="px-2 !leading-none text-xs" asChild>
            <Link href="/state-of-startups">Take the survey</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SOSBanner
