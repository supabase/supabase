import React from 'react'
import SectionContainer from '../Layouts/SectionContainer'
import MagnifiedProducts from '../MagnifiedProducts'

interface Props {}

function ProductsCta(props: Props) {
  return (
    <SectionContainer>
      <div className="flex flex-col text-center gap-4 items-center justify-center">
        <h2 className="heading-gradient text-2xl sm:text-3xl xl:text-4xl">
          Pick your SupaPower(s)
        </h2>
        <p className="mx-auto text-scale-900">
          Supabase products are built to work both in isolation and seamlessly together
          <br className="hidden md:block" /> to ensure the most flexible and scalable developer
          experience.
        </p>
      </div>
      <div className="w-full py-12 md:h-[200px] flex items-center justify-center text-center">
        <MagnifiedProducts />
      </div>
    </SectionContainer>
  )
}

export default ProductsCta
