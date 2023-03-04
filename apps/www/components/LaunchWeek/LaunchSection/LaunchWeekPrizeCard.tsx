import Image from 'next/image'
import React from 'react'

export default function LaunchWeekPrizeCard({
  imageUrl,
  imageWrapperClassName,
  content,
  className,
}: {
  imageUrl: string
  imageWrapperClassName?: string
  content: any
  className?: string
}) {
  return (
    <div
      className={[
        'relative p-[1px] bg-gradient-to-b from-[#484848] to-[#1C1C1C] rounded-lg overflow-hidden',
        className && className,
      ].join(' ')}
    >
      <div className="relative h-full flex flex-col bg-[#1C1C1C] rounded-lg overflow-hidden">
        <div
          className={[
            "relative w-full flex-grow before:content[' '] before:absolute before:inset-0 before:z-10 before:bg-gradient-to-t before:from-[#1C1C1C]",
            imageWrapperClassName && imageWrapperClassName,
          ].join(' ')}
        >
          <Image src={imageUrl ?? ''} layout="fill" objectFit="cover" />
        </div>
        <div className="p-4">{content && content}</div>
      </div>
    </div>
  )
}
