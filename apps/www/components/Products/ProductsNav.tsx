import React from 'react'
import { cn } from 'ui'
import Link from 'next/link'
import { PRODUCT_NAMES, products } from 'shared-data/products'

import SectionContainer from '~/components/Layouts/SectionContainer'

interface Props {
  activePage: PRODUCT_NAMES
}

function ProductsNav({ activePage }: Props) {
  return (
    <nav className="relative z-30 hidden md:flex items-center bg-background w-full border-b">
      <SectionContainer className="!py-0 flex gap-3 items-center">
        {Object.entries(products).map((obj: any) => {
          const product = obj[1]
          const isAuth = product.name === PRODUCT_NAMES.AUTHENTICATION

          return (
            <Link
              key={product.name}
              className={cn(
                'flex items-center gap-1.5 px-2 first:-ml-2 py-4 border-b border-transparent text-sm text-foreground-lighter hover:text-foreground',
                'focus-visible:ring-2 focus-visible:ring-foreground-lighter focus-visible:text-foreground focus-visible:outline-brand-600',
                product.name === activePage && 'border-foreground-light text-foreground'
              )}
              href={`/${isAuth ? 'auth' : product.name.toLowerCase().replace(' ', '-')}`}
            >
              <svg
                className="h-4 w-4 group-hover/menu-item:text-foreground group-focus-visible/menu-item:text-foreground"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 18 18"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1"
                  d={product.icon['18']}
                  stroke="currentColor"
                />
              </svg>
              <p>{isAuth ? 'Auth' : product.name}</p>
            </Link>
          )
        })}
      </SectionContainer>
    </nav>
  )
}

export default ProductsNav
