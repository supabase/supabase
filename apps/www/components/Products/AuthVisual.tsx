import Image from 'next/image'
import React from 'react'

const AuthVisual = () => {
  return (
    <div className="absolute inset-0 z-0">
      <Image
        src="/images/index/products/auth2.svg"
        alt="Supabase Authentication hover state"
        layout="fill"
        objectFit="cover"
        objectPosition="center"
        className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        quality={100}
      />
      <Image
        src="/images/index/products/auth1.svg"
        alt="Supabase Authentication"
        layout="fill"
        objectFit="cover"
        objectPosition="center"
        className="antialiased"
        quality={100}
      />
    </div>
  )
}

export default AuthVisual
