import Image from 'next/image'
import React from 'react'
import { motion } from 'framer-motion'

type animateFromType = 'left' | 'right' | 'up' | 'down' | 'opacityOnly'

export default function LaunchWeekPrizeCard({
  imageUrl = '',
  imageWrapperClassName,
  content,
  className,
  animateFrom,
  imgObjectPosition = 'center',
}: {
  imageUrl: string
  imageWrapperClassName?: string
  content: any
  className?: string
  animateFrom?: animateFromType
  imgObjectPosition?: string
}) {
  const finalState = { x: 0, y: 0, opacity: 1 }

  function getAnimationFrom(animationDirection: animateFromType) {
    switch (animationDirection) {
      case 'left':
        return { x: -20, opacity: 0 }
      case 'up':
        return { y: -20, opacity: 0 }
      case 'right':
        return { x: 20, opacity: 0 }
      case 'down':
        return { y: 20, opacity: 0 }
      case 'opacityOnly':
        return { opacity: 0 }
    }
  }

  return (
    <motion.div
      className={[
        'relative p-[1px] bg-gradient-to-b from-[#484848] to-[#1C1C1C] rounded-lg overflow-hidden shadow-lg',
        className && className,
      ].join(' ')}
      initial={animateFrom ? getAnimationFrom(animateFrom) : finalState}
      whileInView={finalState}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ type: 'spring', bounce: 0, delay: 0.5 }}
    >
      <div className="relative h-full flex flex-col bg-[#1C1C1C] rounded-lg overflow-hidden">
        <div
          className={[
            "relative w-full flex-grow before:content[' '] before:absolute before:inset-0 before:z-10 before:bg-gradient-to-t before:from-[#1C1C1C]",
            imageWrapperClassName && imageWrapperClassName,
          ].join(' ')}
        >
          <Image
            src={imageUrl}
            fill
            className="object-cover"
            objectPosition={imgObjectPosition}
            alt=""
          />
        </div>
        <div className="p-4">{content && content}</div>
      </div>
    </motion.div>
  )
}
