import { useBreakpoint } from 'common'
import Image from 'next/image'
import React, { ReactNode } from 'react'
import { Modal, cn } from 'ui'
import { Play } from 'lucide-react'

interface ExpandableVideoProps {
  videoId: string
  imgUrl?: string
  imgOverlayText?: string
  triggerContainerClassName?: string
  imgAltText?: string
  trigger?: ReactNode
  onOpenCallback?: any
  priority?: boolean
}

export function ExpandableVideo({
  imgUrl,
  videoId,
  imgOverlayText,
  triggerContainerClassName = '',
  imgAltText,
  trigger,
  onOpenCallback,
  priority = false,
}: ExpandableVideoProps) {
  const [expandVideo, setExpandVideo] = React.useState(false)
  const isMobile = useBreakpoint(768)

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case 'Escape':
          return setExpandVideo(false)
        default:
          return
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  React.useEffect(() => {
    if (isMobile) setExpandVideo(false)
  }, [isMobile])

  const CliccablePreview = () => (
    <div className="video-container overflow-hidden rounded hover:cursor-pointer">
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
          before:opacity-30
          before:-z-10
          hover:before:opacity-50
          before:transition-opacity
        "
      >
        <Play strokeWidth={2} size="small" className="w-5 h-5" />
        <p className="text-sm">{imgOverlayText ?? 'Watch video guide'}</p>
      </div>
      <Image
        src={imgUrl ?? '/images/blur.png'}
        alt={imgAltText ?? 'Video guide preview'}
        fill
        sizes="100%"
        priority={priority}
        className="absolute inset-0 object-cover blur-sm scale-105"
      />
    </div>
  )

  return (
    <>
      <Modal
        visible={expandVideo}
        hideFooter
        className={cn(
          '!bg-[#f8f9fa]/95 dark:!bg-[#1c1c1c]/80',
          '!border-[#e6e8eb]/90 dark:!border-[#282828]/90',
          'transition ease-out',
          'mx-auto backdrop-blur-md w-[calc(100%-2rem)]'
        )}
        onInteractOutside={(e) => {
          // Only hide menu when clicking outside, not focusing outside
          // Prevents Firefox dropdown issue that immediately closes menu after opening
          if (e.type === 'dismissableLayer.pointerDownOutside') {
            setExpandVideo(!expandVideo)
          }
        }}
        size="xxlarge"
      >
        <div className="!w-full flex items-center justify-center">
          <div className="relative w-full">
            <button
              onClick={() => setExpandVideo(false)}
              className="text-foreground-light hover:text-foreground absolute -top-8 right-0"
            >
              <p className="text-xs">Close</p>
            </button>
            <div className="video-container !rounded overflow-hidden">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </Modal>
      <button
        onClick={() => {
          if (onOpenCallback) onOpenCallback()
          setExpandVideo(true)
        }}
        className={['w-full', triggerContainerClassName].join(' ').trim()}
      >
        {trigger ?? <CliccablePreview />}
      </button>
    </>
  )
}
