import Image from 'next/image'
import React from 'react'

const StorageVisual = () => {
  return (
    <div className="absolute inset-0 overflow-hidden flex nowrap">
      <div className="relative h-full left-0 w-auto items-center z-0 flex pause animate-marquee group-hover:run will-change-transform transition-transform">
        <div className="relative h-full aspect-[1/1.44]">
          <Image
            src="/images/index/products/storage.svg"
            alt="Supabase Storage"
            layout="fill"
            objectFit="cover"
            className="antialiased"
          />
        </div>
        <div className="relative h-full aspect-[1/1.44]">
          <Image
            src="/images/index/products/storage.svg"
            alt="Supabase Storage"
            layout="fill"
            objectFit="cover"
            className="antialiased"
          />
        </div>
      </div>
      <div className="relative h-full left-0 w-auto items-center z-0 flex pause animate-marquee group-hover:run will-change-transform transition-transform">
        <div className="relative h-full aspect-[1/1.44]">
          <Image
            src="/images/index/products/storage.svg"
            alt="Supabase Storage"
            layout="fill"
            objectFit="cover"
            className="antialiased"
          />
        </div>
        <div className="relative h-full aspect-[1/1.44]">
          <Image
            src="/images/index/products/storage.svg"
            alt="Supabase Storage"
            layout="fill"
            objectFit="cover"
            className="antialiased"
          />
        </div>
      </div>
    </div>
  )
}

export default StorageVisual
