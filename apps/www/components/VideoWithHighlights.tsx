import React from 'react'
import { IconCheck } from 'ui'

interface Props {
  video: string
  highlights: string[]
}

const VideoWithHighlights = (props: Props) => {
  return (
    <div className="relative w-full aspect-video">
      <ul className="absolute w-full -bottom-8 lg:bottom-auto lg:-top-14 flex flex-wrap items-center gap-4 lg:gap-8 justify-center text-center mx-auto z-30">
        {props.highlights.map((highlight) => (
          <li key={highlight} className="flex items-center gap-2 text-sm whitespace-nowrap">
            <IconCheck /> {highlight}
          </li>
        ))}
      </ul>
      <div
        className="absolute w-full h-full z-20 pointer-events-none inset-0"
        style={{
          background: `radial-gradient(75% 100% at 50% 0%, transparent, transparent 50%, var(--color-bg-darkest))`,
        }}
      />
      <video className="relative z-0" height="100%" width="100%" loop muted autoPlay>
        <source src={props.video} type="video/mp4" />
      </video>
    </div>
  )
}

export default VideoWithHighlights
