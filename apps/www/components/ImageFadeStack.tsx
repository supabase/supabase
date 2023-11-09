import Image from 'next/image'
import React, { useState, useEffect } from 'react'
import { IconPauseCircle, IconPlayCircle, cn } from 'ui'

interface ImageFadeStackProps {
  autoplay?: boolean
  images: string[]
  height?: 'default'
  delay?: number
  altText?: string
  showNavigation?: boolean
}

const ImageFadeStack = ({
  images,
  height = 'default',
  delay = 3000,
  autoplay = false,
  altText = 'Image',
  showNavigation = false,
}: ImageFadeStackProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoplay)

  useEffect(() => {
    if (isPlaying) {
      const intervalId = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length)
      }, delay)

      return () => clearInterval(intervalId)
    }
  }, [images, isPlaying])

  function handleNavClick(index: number) {
    setIsPlaying(false)
    setCurrentImageIndex(index)
  }

  return (
    <div className={`relative ${height === 'default' ? 'h-[300px]' : 'h-[400px]'} my-6`}>
      {images.map((image, index) => (
        <>
          <Image
            className="absolute top-0 left-0"
            key={index}
            src={image}
            layout="fill"
            alt={altText}
            style={{
              opacity: currentImageIndex === index ? 1 : 0,
              transition: 'opacity 1s ease-in-out',
            }}
          />
        </>
      ))}
      <div className="absolute bottom-4 right-4 flex gap-3">
        {showNavigation &&
          images.map((_, index) => (
            <button className="text-white" onClick={() => handleNavClick(index)}>
              <div
                className={cn(
                  'w-2 h-2 rounded-full bg-foreground-muted hover:bg-surface-100 transition-colors',
                  currentImageIndex === index && 'bg-border-strong'
                )}
              />
            </button>
          ))}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="text-white bg-foreground-light hover:bg-overlay rounded-full p-0.5 transition-colors"
        >
          {isPlaying ? <IconPauseCircle w={12} /> : <IconPlayCircle w={12} />}
        </button>
      </div>
    </div>
  )
}

export default ImageFadeStack
