import React from 'react'
import SectionContainer from '../../../Layouts/SectionContainer'
import Image from 'next/image'
import GALogo from '../GALogo'

const LWXHeader = () => {
  return (
    <div className="pt-16 w-full overflow-hidden">
      <SectionContainer className="h-full flex flex-col">
        <GALogo className="w-24 md:w-44 aspect-[1.83/1] h-auto min-h-16 md:min-h-24" />
        <p className="text-foreground-lighter text-xl md:text-2xl">
          Supabase is{' '}
          <strong className="font-normal text-foreground">
            officially launching into General Availability
          </strong>
          .<br className="hidden sm:block" /> Join us in this major milestone and explore all the
          features that come with it.
        </p>
      </SectionContainer>
    </div>
  )
}

export default LWXHeader
