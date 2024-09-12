import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useInView } from 'framer-motion'

type VideoType = {
  sources: {
    src: string
    type?: string
  }[]
  poster?: string
  title?: string
}

interface Props {
  video: VideoType
  highlights?: { label: string; link?: string }[]
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
    <div ref={sectionRef} className="relative">
      {showVideo && (
        <>
          <video
            className="relative z-0 block reduce-motion:hidden"
            title="Supabase Table Editor"
            height="100%"
            width="100%"
            loop
            muted
            autoPlay
            controls={false}
            playsInline
            poster={props.video.poster ?? '/images/index/dashboard/supabase-table-editor.png'}
          >
            {props.video.sources.map((source) => (
              <source key={source.src} src={source.src} type={source.type ?? 'video/mp4'} />
            ))}
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
    </div>
  )
}

export default VideoWithHighlights
