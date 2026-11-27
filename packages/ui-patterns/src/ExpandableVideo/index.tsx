import { FrameworkImage, useBreakpoint } from 'common'
import { Play } from 'lucide-react'
import React, { ReactNode } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from 'ui'

interface ExpandableVideoProps {
  videoId: string
  imgUrl?: string
  imgOverlayText?: string
  triggerContainerClassName?: string
  imgAltText?: string
  videoTitle?: string
  trigger?: ReactNode
  onOpenCallback?: any
  priority?: boolean
}

export const EXPANDABLE_VIDEO_THUMBNAIL_SIZES = '320px'

export function ExpandableVideo({
  imgUrl,
  videoId,
  imgOverlayText,
  triggerContainerClassName = '',
  imgAltText,
  videoTitle,
  trigger,
  onOpenCallback,
  priority = false,
}: ExpandableVideoProps) {
  const [expandVideo, setExpandVideo] = React.useState(false)
  const isMobile = useBreakpoint(768)

  React.useEffect(() => {
    if (isMobile) setExpandVideo(false)
  }, [isMobile])

  const CliccablePreview = () => (
    <div className="video-container overflow-hidden rounded-sm hover:cursor-pointer bg-alternative border">
      <div
        className="
          absolute inset-0 z-10
          text-white
          flex flex-col gap-3
          items-center justify-center
          before:content['']
          before:absolute
          before:inset-0
          before:bg-black
          before:opacity-60
          before:-z-10
          hover:before:opacity-80
          before:transition-opacity
        "
      >
        <Play strokeWidth={2} className="w-5 h-5" />
        <p className="text-sm">{imgOverlayText ?? 'Watch video guide'}</p>
      </div>
      <FrameworkImage
        src={imgUrl ?? '/images/blur.png'}
        // no fallback as alt text here would repeat it
        alt={imgAltText ?? ''}
        fill
        sizes="100%"
        priority={priority}
        className="absolute inset-0 object-cover blur-md scale-105"
      />
    </div>
  )

  return (
    <>
      <Dialog open={expandVideo} onOpenChange={(open) => setExpandVideo(open)}>
        <DialogTrigger asChild>
          <button
            onClick={() => {
              if (onOpenCallback) onOpenCallback()
              setExpandVideo(true)
            }}
            className={['w-full', triggerContainerClassName].join(' ').trim()}
            aria-label={videoTitle ? `Play video: ${videoTitle}` : undefined}
          >
            {trigger ?? <CliccablePreview />}
          </button>
        </DialogTrigger>
        <DialogContent
          size="xxlarge"
          className="
            ease-enter data-open:duration-200 data-closed:duration-150
            motion-reduce:zoom-in-100! motion-reduce:zoom-out-100!
          "
          dialogOverlayProps={{
            className: `
              ease-enter data-open:animate-in data-open:fade-in data-open:duration-200
              data-closed:animate-out! data-closed:fade-out data-closed:fill-mode-forwards
              data-closed:duration-150
            `,
          }}
        >
          <DialogTitle className="sr-only">{videoTitle ?? 'Video player'}</DialogTitle>
          <div className="w-full! flex items-center justify-center">
            <div className="relative w-full">
              <button
                onClick={() => setExpandVideo(false)}
                className="text-foreground-light hover:text-foreground absolute -top-8 right-0"
              >
                <p className="text-xs">Close</p>
              </button>
              <div className="video-container rounded-lg! border-none! overflow-hidden!">
                {imgUrl ? (
                  <FrameworkImage
                    src={imgUrl}
                    alt=""
                    fill
                    sizes={EXPANDABLE_VIDEO_THUMBNAIL_SIZES}
                    className="object-cover"
                  />
                ) : null}
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
                  title={videoTitle ?? 'Video player'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="scheme-normal"
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
