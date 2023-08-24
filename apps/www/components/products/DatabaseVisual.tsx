import Image from 'next/image'
import React from 'react'

export default function DatabaseVisual() {
  return (
    <div className="absolute inset-0 z-0">
      <div className="absolute w-full lg:w-auto h-full lg:aspect-square flex items-end lg:items-center justify-center lg:justify-end right-0 top-auto lg:top-0 bottom-0 my-auto">
        <Image
          src="/images/index/products/database.svg"
          alt="Supabase Postgres Database"
          layout="fill"
          objectFit="cover"
          objectPosition="right"
          className="antialiased"
          quality={100}
        />
      </div>
    </div>
  )
}
