import Link from 'next/link'
import React from 'react'
import { Button } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import MagnifiedProducts from '~/components/MagnifiedProducts'
import { PRODUCT_SHORTNAMES } from '~/lib/constants'

export type Products = PRODUCT_SHORTNAMES

interface Props {
  currentProduct: Products | string
}

function ProductsCta(props: Props) {
  return (
    <SectionContainer className="overflow-hidden flex flex-col xl:grid xl:grid-cols-2 gap-4 md:gap-8 xl:gap-10">
      <div className="w-full py-12 md:h-[200px] flex items-center justify-center text-center col-span-1">
        <MagnifiedProducts currentProduct={props.currentProduct} />
      </div>
      <div className="flex flex-col gap-4 col-span-1 text-center xl:text-left xl:justify-center items-center xl:items-start">
        <h2 className="heading-gradient text-2xl sm:text-3xl xl:text-4xl">
          Ready to start building?
        </h2>
        <p className="mx-auto text-foreground-lighter">
          Supabase products are built to work both in isolation and seamlessly together to ensure
          the most flexible and scalable developer experience.
        </p>
        <div className="flex gap-2 py-4">
          <Button asChild type="primary" size="small" className="h-full">
            <Link href="https://supabase.com/dashboard">Start for free</Link>
          </Button>
          <Button asChild type="default" size="small">
            <Link href="/docs">See documentation</Link>
          </Button>
        </div>
      </div>
    </SectionContainer>
  )
}

export default ProductsCta
