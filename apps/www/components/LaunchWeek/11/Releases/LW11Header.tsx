import React from 'react'
import SectionContainer from '../../../Layouts/SectionContainer'
import Image from 'next/image'
import GALogo from '../GALogo'
import LW11Background from '../LW11Background'

const LWXHeader = () => {
  return (
    <div className="relative w-full overflow-visible">
      <SectionContainer className="h-full flex flex-col gap-4 !max-w-none lg:!container">
        <GALogo className="w-20 md:w-24 aspect-[1.83/1] h-auto min-h-20 md:min-h-24" />
        <p className="text-foreground-lighter text-xl md:text-2xl">
          Supabase is{' '}
          <strong className="font-normal text-foreground">
            officially launching into General Availability
          </strong>
          .<br className="hidden sm:block" /> Join us in this major milestone and explore all the
          features that come with it.
        </p>
      </SectionContainer>
      <LW11Background className="absolute z-0 inset-0 w-full h-full flex items-center justify-center opacity-100 transition-opacity" />
    </div>
  )
}

export default LWXHeader
