import React from 'react'

import type { YouTubeBlock as YouTubeBlockProps } from '@/payload-types'
import { cn } from '@/utilities/ui'

type Props = {
  className?: string
} & YouTubeBlockProps

export const YouTubeBlock: React.FC<Props> = ({ className, youtubeId }) => {
  return (
    <div className={cn('video-container', className)}>
      <iframe
        className="w-full"
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  )
}
