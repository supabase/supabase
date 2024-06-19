import React from 'react'
import SectionContainer from '../../../Layouts/SectionContainer'
import Image from 'next/image'

const LWXHeader = () => {
  return (
    <div className="pt-16 w-full h-[175px] sm:h-[275px] overflow-hidden">
      <SectionContainer className="!py-0 h-full flex justify-end">
        <Image
          src="/images/launchweek/lwx/lwx_header.svg"
          alt="Launch Week X header"
          width={300}
          height={300}
          draggable={false}
          className="relative -right-[112px] sm:-right-[63px] object-cover !object-center h-full aspect-square scale-[120%] overflow-visible"
        />
      </SectionContainer>
    </div>
  )
}

export default LWXHeader
