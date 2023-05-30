import Image from 'next/image'
import React from 'react'
import OpenAISVG from './OpenAISVG'

const OpenAIImage = () => {
  return (
    <>
      <div
        className="absolute inset-0 w-full h-full z-10"
        style={{
          background: `radial-gradient(100% 50% at 50% 50%, transparent, var(--colors-scale2))`,
        }}
      />
      {/* <Image
        src="/images/product/vector/highlight-openai.png"
        alt="OpenAI vector graphic"
        layout="fill"
        objectFit="cover"
      /> */}
      <OpenAISVG />
    </>
  )
}

export default OpenAIImage
