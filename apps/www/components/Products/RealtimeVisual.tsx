import Image from 'next/image'
import React from 'react'

const RealtimeVisual = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <img
        src="/images/index/products/realtime-user-cursor.svg"
        className="absolute w-6 h-6 z-10 left-14 bottom-[100px] transition translate-x-8 translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 !duration-300"
      />
      <img
        src="/images/index/products/realtime-user-cursor.svg"
        className="absolute w-6 h-6 z-10 right-[40%] bottom-3 transition translate-x-80 group-hover:translate-x-0 !duration-700"
      />
      <Image
        src="/images/index/products/realtime.svg"
        alt="Supabase Realtime"
        layout="fill"
        objectPosition="50% 50%"
        objectFit="cover"
        className="antialiased"
        quality={100}
      />
    </div>
  )
}

export default RealtimeVisual
