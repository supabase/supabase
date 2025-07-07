'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from 'ui/src/components/Button'

export function LW15Banner() {
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const isLWPage = pathname?.includes('/launch-week')

  if (isHomePage || isLWPage) return null

  return (
    <div className="relative w-full p-2 flex items-center group justify-center text-foreground bg-alternative border-b border-muted transition-colors overflow-hidden">
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
      <div className="relative z-10 flex items-center justify-center">
        <div className="w-full flex gap-5 md:gap-10 items-center md:justify-center text-sm">
          <p className="flex gap-1.5 items-center font-mono uppercase tracking-widest text-sm">
            <span className="hidden sm:inline">Launch Week</span>
            <span className="inline sm:hidden">LW</span> 15 / July 14—18
          </p>
          <Button size="tiny" type="default" className="px-2 !leading-none text-xs" asChild>
            <Link href="/launch-week">Claim your ticket</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default LW15Banner
