import React from 'react'
import SectionContainer from '~/components/Layouts/SectionContainer'
import MagnifiedProducts from '~/components/MagnifiedProducts'
import { PRODUCT_SHORTNAMES } from '~/lib/constants'

export type Products = PRODUCT_SHORTNAMES

interface Props {
  currentProduct: Products | string
}

function ProductsCta(props: Props) {
  return (
    <SectionContainer className="overflow-hidden">
      <div className="flex flex-col text-center gap-4 items-center justify-center">
        <h2 className="heading-gradient text-2xl sm:text-3xl xl:text-4xl">
          Pick your SupaPower(s)
        </h2>
        <p className="mx-auto text-foreground-lighter">
          Supabase products are built to work both in isolation and seamlessly together
          <br className="hidden md:block" /> to ensure the most flexible and scalable developer
          experience.
        </p>
      </div>
      <div className="w-full py-12 md:h-[200px] flex items-center justify-center text-center">
        <MagnifiedProducts currentProduct={props.currentProduct} />
      </div>
    </SectionContainer>
  )
}

export default ProductsCta
