import Image from 'next/image'
import React from 'react'

const RealtimeVisual = () => {
  return (
    <figure
      className="absolute inset-0 z-0 overflow-hidden"
      style={{
        background: 'radial-gradient(320px 320px at 30% 100%, #85E0B740, transparent)',
      }}
      role="img"
      aria-label="Supabase Realtime multiplayer app demo"
    >
      <img
        src="/images/index/products/realtime-user-cursor.svg"
        alt="user cursor"
        className="absolute w-6 h-6 z-10 left-14 bottom-[100px] transition translate-x-8 translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 !duration-300 will-change-transform"
      />
      <img
        src="/images/index/products/realtime-user-cursor.svg"
        alt="user cursor"
        className="absolute w-6 h-6 z-10 right-[40%] bottom-3 transition translate-x-80 group-hover:translate-x-0 !duration-700 will-change-transform"
      />
      <Image
        src="/images/index/products/realtime-bg.svg"
        alt="Supabase Realtime app demo UI"
        layout="fill"
        objectPosition="50% 50%"
        objectFit="cover"
      />
    </figure>
  )
}

export default RealtimeVisual
