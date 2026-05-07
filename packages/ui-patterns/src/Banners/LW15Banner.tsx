'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { Button } from 'ui/src/components/Button'

import announcement from '../Banners/data.json'

export function LW15Banner() {
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const isLWPage = pathname?.includes('/launch-week')
  const videoRef = useRef<HTMLVideoElement>(null)

  // Force play video
  useEffect(() => {
    if (!videoRef || !videoRef.current) return

    //open bug since 2017 that you cannot set muted in video element https://github.com/facebook/react/issues/10389
    videoRef.current.defaultMuted = true
    videoRef.current.muted = true

    if (!!videoRef && !!videoRef.current) {
      const promise = videoRef.current.play()
      videoRef.current.play()
      if (promise !== undefined) {
        promise.then(() => {
          // Auto-play started
          videoRef.current?.play()
        })
      }
    }
  }, [videoRef])

  if (isHomePage || isLWPage) return null

  return (
    <div className="relative w-full p-2 flex items-center group justify-center text-foreground bg-alternative border-b border-muted transition-colors overflow-hidden">
      <video
        ref={videoRef}
        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/launch-week/lw15/assets/lw15-galaxy.mp4`}
        poster={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/launch-week/lw15/assets/lw15-galaxy.png`}
        autoPlay
        loop
        muted
        playsInline
        controls={false}
        className="absolute w-full h-full inset-0 object-cover z-0"
        style={{
          opacity: 0.05,
        }}
      />
      <div className="relative z-10 flex items-center justify-center">
        <div className="w-full flex gap-5 md:gap-10 items-center md:justify-center text-sm">
          <p className="flex gap-1.5 items-center font-mono uppercase tracking-widest text-sm">
            {announcement.text}
          </p>
          <p className="text-sm hidden sm:block">{announcement.launch}</p>
          <Button size="tiny" type="default" className="px-2 !leading-none text-xs" asChild>
            <Link href={announcement.link}>{announcement.cta}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default LW15Banner
