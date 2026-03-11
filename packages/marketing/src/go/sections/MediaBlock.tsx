import type { GoImage, GoVideo } from '../schemas'

interface MediaBlockProps {
  image?: GoImage
  video?: GoVideo
  youtubeUrl?: string
  className?: string
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    let id: string | null = null

    if (parsed.hostname === 'youtu.be') {
      id = parsed.pathname.slice(1)
    } else if (parsed.hostname === 'www.youtube.com' || parsed.hostname === 'youtube.com') {
      if (parsed.pathname.startsWith('/embed/')) {
        id = parsed.pathname.split('/embed/')[1]
      } else {
        id = parsed.searchParams.get('v')
      }
    }

    return id ? `https://www.youtube.com/embed/${id}` : null
  } catch {
    return null
  }
}

export default function MediaBlock({ image, video, youtubeUrl, className }: MediaBlockProps) {
  const embedUrl = youtubeUrl ? getYouTubeEmbedUrl(youtubeUrl) : null

  const media = image ? (
    <img
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      className="w-full h-auto rounded-xl border"
    />
  ) : video ? (
    <video
      src={video.src}
      poster={video.poster}
      autoPlay
      muted
      loop
      playsInline
      className="w-full h-auto rounded-xl border"
    />
  ) : embedUrl ? (
    <div
      className="relative w-full rounded-xl border overflow-hidden"
      style={{ paddingBottom: '56.25%' }}
    >
      <iframe
        src={embedUrl}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  ) : null

  if (!media) return null

  return <div className={className}>{media}</div>
}
