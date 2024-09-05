import React, { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { Check } from 'lucide-react'
import Link from 'next/link'
import BrowserFrame from './BrowserFrame'
import Image from 'next/image'

interface Props {
  video: { src: string; poster?: string }
  highlights: { label: string; link?: string }[]
}

const VideoWithHighlights = (props: Props) => {
  const [showVideo, setShowVideo] = useState(false)
  const sectionRef = useRef(null)

  const isInView = useInView(sectionRef, {
    amount: 0,
  })

  useEffect(() => {
    if (isInView) {
      setShowVideo(true)
    }
  })

  return (
    <div ref={sectionRef} className="relative w-full max-w-7xl mx-auto">
      <ul className="absolute w-full -bottom-8 lg:bottom-auto lg:-top-20 flex flex-wrap items-center gap-4 lg:gap-8 justify-center text-center mx-auto z-30">
        {props.highlights.map((highlight) => (
          <li key={highlight.label}>
            <Link
              href={highlight.link ?? '#'}
              className="group cursor-pointer flex items-center gap-2 text-sm whitespace-nowrap text-foreground-light hover:text-foreground transition-colors hover:underline"
            >
              <Check className="stroke-2 w-4" />
              <span>{highlight.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div
        className="absolute lg:hidden w-full h-full z-20 pointer-events-none inset-0"
        style={{
          background: `linear-gradient(to bottom, transparent, transparent 50%, hsl(var(--background-default)))`,
        }}
      />
      <BrowserFrame className="overflow-hidden bg-default" contentClassName="aspect-video">
        {showVideo && (
          <>
            <video
              className="relative z-0 rounded-xl overflow-hidden border block reduce-motion:hidden"
              title="Supabase Table Editor"
              height="100%"
              width="100%"
              loop
              muted
              autoPlay
              poster={props.video.poster ?? '/images/index/dashboard/supabase-table-editor.png'}
            >
              <source src={props.video.src} type="video/mp4" />
            </video>
            <Image
              src="/images/index/dashboard/supabase-table-editor.png"
              alt="Supabase Table Editor"
              width={1920}
              height={1080}
              className="reduce-motion:block hidden relative z-0 rounded-xl overflow-hidden border"
            />
          </>
        )}
      </BrowserFrame>
    </div>
  )
}

export default VideoWithHighlights
