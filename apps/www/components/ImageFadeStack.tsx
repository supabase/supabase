import Image from 'next/image'
import React, { useState, useEffect } from 'react'
import { IconCircle, IconDroplet, IconPauseCircle, IconPlayCircle } from 'ui'
import { cn } from '~/../../packages/ui/src/utils/cn'

interface ImageFadeStackProps {
  images: string[]
  height?: 'default'
  delay?: number
}

const ImageFadeStack = ({ images, height = 'default', delay = 3000 }: ImageFadeStackProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

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
    <div className={`relative ${height === 'default' ? 'min-h-[320px]' : 'min-h-[400px]'} my-12`}>
      {images.map((image, index) => (
        <>
          <Image
            className="absolute top-0 left-0"
            key={index}
            src={image}
            layout="fill"
            alt={`Image ${index + 1}`}
            style={{
              opacity: currentImageIndex === index ? 1 : 0,
              transition: 'opacity 1s ease-in-out',
            }}
          />
        </>
      ))}
      <div className="absolute bottom-4 right-4 flex gap-3">
        {images.map((_, index) => (
          <button className="text-white" onClick={() => handleNavClick(index)}>
            <div
              className={cn(
                'w-2 h-2 rounded-full bg-scale-900 hover:bg-gray-300 transition-colors',
                currentImageIndex === index && 'bg-scale-700'
              )}
            />
          </button>
        ))}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="text-scale-1100 dark:text-white bg-scale-700 hover:bg-gray-1100 dark:hover:bg-gray-500 rounded-full p-0.5 transition-colors"
        >
          {isPlaying ? <IconPauseCircle w={12} /> : <IconPlayCircle w={12} />}
        </button>
      </div>
    </div>
  )
}

export default ImageFadeStack
