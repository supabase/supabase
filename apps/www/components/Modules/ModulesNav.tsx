import React from 'react'
import { cn, ScrollArea } from 'ui'
import Link from 'next/link'
import { PRODUCT_MODULES_NAMES } from 'shared-data/products'

import SectionContainer from '~/components/Layouts/SectionContainer'
import ProductModules from '~/data/ProductModules'

interface Props {
  activePage: PRODUCT_MODULES_NAMES
}

function ModulesNav({ activePage }: Props) {
  return (
    <nav className="relative z-30 flex flex-nowrap items-center bg-alternative w-full border-b border-muted">
      <SectionContainer className="!py-0 flex gap-3 items-center">
        <div className="w-max flex gap-3 items-center">
          {Object.entries(ProductModules).map((obj: any) => {
            const module = obj[1]

            return (
              <Link
                key={module.name}
                className={cn(
                  'flex items-center gap-1.5 px-2 first:-ml-2 py-3 border-b border-transparent text-sm text-foreground-lighter hover:text-foreground',
                  'focus-visible:ring-2 focus-visible:ring-foreground-lighter focus-visible:text-foreground focus-visible:outline-brand-600',
                  module.name === activePage && 'border-foreground-light text-foreground'
                )}
                href={module.url ?? ''}
              >
                <svg
                  className="h-4 w-4 group-hover/menu-item:text-foreground group-focus-visible/menu-item:text-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d={module.icon}
                    stroke="currentColor"
                  />
                </svg>
                <p>{module.name}</p>
              </Link>
            )
          })}
        </div>
      </SectionContainer>
    </nav>
  )
}

export default ModulesNav
