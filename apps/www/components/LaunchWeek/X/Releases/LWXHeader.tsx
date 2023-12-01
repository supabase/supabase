import React from 'react'
import SectionContainer from '../../../Layouts/SectionContainer'
import Image from 'next/image'

const LWXHeader = () => {
  return (
    <div className="w-full h-[215px] overflow-hidden">
      <SectionContainer className="!py-0 h-full flex justify-end">
        <Image
          src="/images/launchweek/lwx/lwx_header.svg"
          alt="Launch Week X header"
          width={300}
          height={300}
          draggable={false}
          className="relative -right-[75px] object-cover !object-center h-full aspect-square overflow-visible"
        />
      </SectionContainer>
    </div>
  )
}

export default LWXHeader
