import { useBreakpoint } from 'common'
import Image from 'next/image'
import React, { ReactNode } from 'react'
import { IconPlay, Modal } from 'ui'

interface ExpandableVideoProps {
  videoId: string
  imgUrl?: string
  imgOverlayText?: string
  triggerContainerClassName?: string
  imgAltText?: string
  trigger?: ReactNode
  onOpenCallback?: any
}

export function ExpandableVideo({
  imgUrl,
  videoId,
  imgOverlayText,
  triggerContainerClassName = '',
  imgAltText,
  trigger,
  onOpenCallback,
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
        className={`absolute inset-0 z-10 text-whiteA-1200 flex flex-col items-center justify-center gap-3 backdrop-blur-sm
                before:content[''] before:-z-10 before:absolute before:inset-0 before:bg-black before:opacity-30 hover:before:opacity-50 before:transition-opacity
              `}
      >
        <IconPlay strokeWidth={2} size="small" />
        <p className="text-sm">{imgOverlayText ?? 'Watch video guide'}</p>
      </div>
      <Image
        src={imgUrl ?? '/images/blur.png'}
        alt={imgAltText ?? 'Video guide preview'}
        layout="fill"
        objectFit="cover"
        className="absolute inset-0"
      />
    </div>
  )

  return (
    <>
      <Modal
        visible={expandVideo}
        hideFooter
        className={[
          '!bg-[#f8f9fa]/95 dark:!bg-[#1c1c1c]/80',
          '!border-[#e6e8eb]/90 dark:!border-[#282828]/90',
          'transition ease-out',
          'mx-auto backdrop-blur-md w-[calc(100%-2rem)]',
        ].join(' ')}
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
              className="text-scale-1100 hover:text-scale-1200 absolute -top-8 right-0"
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
