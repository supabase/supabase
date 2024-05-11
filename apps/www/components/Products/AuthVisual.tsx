import Image from 'next/image'
import React from 'react'

const AuthVisual = () => {
  return (
    <figure
      className="group absolute inset-0 z-0 xl:-bottom-10"
      role="img"
      aria-label="Supabase Authentication provides Row Level Security which enables you to define custom Policies to restrict access to your database"
    >
      <Image
        src="/images/index/products/auth.svg"
        alt="Supabase Authentication user db rows"
        fill
        sizes="100%"
        priority
        quality={100}
        className="absolute inset-0 object-cover object-center xl:object-bottom"
      />
      <Image
        src="/images/index/products/auth-active.svg"
        alt="Supabase Authentication user db rows"
        fill
        sizes="100%"
        quality={100}
        className="absolute inset-0 object-cover object-center xl:object-bottom opacity-0 group-hover:opacity-100 transition-opacity"
        aria-hidden
      />
    </figure>
  )
}

export default AuthVisual
