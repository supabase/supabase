import Link from 'next/link'
import React from 'react'
import { Button, cn } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import MagnifiedProducts from '~/components/MagnifiedProducts'
import { PRODUCT_SHORTNAMES } from '~/lib/constants'

export type Products = PRODUCT_SHORTNAMES

interface Props {
  currentProduct: Products | string
  className?: string
}

function ProductsCta(props: Props) {
  return (
    <SectionContainer
      className={cn(
        'overflow-hidden flex flex-col xl:grid xl:grid-cols-2 gap-4 md:gap-8 xl:gap-10',
        props.className
      )}
    >
      <div className="w-full pb-6 md:h-[120px] flex items-center justify-center text-center col-span-1">
        <MagnifiedProducts currentProduct={props.currentProduct} />
      </div>
      <div className="flex flex-col col-span-1 text-center xl:text-left xl:justify-center items-center xl:items-start">
        <h2 className="h2">Ready to start building?</h2>
        <div className="flex gap-2 py-2">
          <Button asChild type="primary" size="small" className="h-full">
            <Link href="https://supabase.com/dashboard">Start for free</Link>
          </Button>
          <Button asChild type="default" size="small">
            <Link href="https://forms.supabase.com/enterprise">Contact Enterprise</Link>
          </Button>
        </div>
      </div>
    </SectionContainer>
  )
}

export default ProductsCta
