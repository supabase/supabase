import React from 'react'
import { useTheme } from 'common/Providers'
import Image from 'next/image'

const SecureAndScalableImg = () => {
  const { isDarkMode } = useTheme()

  return (
    <>
      <div
        className="absolute inset-0 w-full h-full z-10"
        style={{
          background: `radial-gradient(100% 50% at 50% 50%, transparent, var(--colors-scale2))`,
        }}
      />
      <Image
        src={
          isDarkMode
            ? '/images/product/vector/highlight-security.svg'
            : '/images/product/vector/highlight-security-light.svg'
        }
        alt="OpenAI vector graphic"
        layout="fill"
        objectFit="cover"
      />
    </>
  )
}

export default SecureAndScalableImg
