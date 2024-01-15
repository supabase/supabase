import Image from 'next/image'
import React from 'react'

interface Props {
  golden?: boolean
}

export default function TicketHeader({ golden = false }: Props) {
  return (
    <div className="relative z-10 w-full flex mt-4 md:mt-6 h-10">
      <Image
        src={`/images/launchweek/8/lw8-logo${golden ? '-gold' : ''}.png`}
        alt="Launch Week 8 logo"
        layout="fill"
        objectFit="contain"
        objectPosition="left"
      />
    </div>
  )
}
