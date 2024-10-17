import Image from 'next/image'
import { useTheme } from 'next-themes'

type VideoType = {
  sources: {
    src: string
    type?: string
  }[]
  poster: string
  title: string
}

interface Props {
  video: VideoType
  highlights?: { label: string; link?: string }[]
}

const VideoWithHighlights = (props: Props) => {
  const { resolvedTheme } = useTheme()

  return (
    <div className="relative h-full w-full">
      <video
        className="relative z-10 block w-full h-full reduce-motion:hidden"
        height="100%"
        width="100%"
        loop
        muted
        autoPlay
        controls={false}
        playsInline
        poster={
          props.video.poster ??
          `/images/index/dashboard/supabase-table-editor${resolvedTheme?.includes('dark') ? '' : '-light'}.png`
        }
      >
        {props.video.sources.map((source, i) => (
          <source
            key={`${source.src}${i === 0 ? '.webm' : '.mp4'}`}
            src={`${source.src}${i === 0 ? '.webm' : '.mp4'}`}
            type={source.type ?? i === 0 ? 'video/webm' : 'video/mp4'}
          />
        ))}
      </video>
      <Image
        src={props.video.poster}
        alt={props.video.title}
        width={1920}
        height={1080}
        className="reduce-motion:block relative z-0 overflow-hidden"
      />
    </div>
  )
}

export default VideoWithHighlights
