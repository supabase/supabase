import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import Link from 'next/link'

import { useBreakpoint } from 'common'
import { IconChevronRight, TextLink } from 'ui'
import { NavigationMenuLink } from 'ui/src/components/shadcn/ui/navigation-menu'
import MenuItem from './MenuItem'

import ComparisonsData from 'data/Comparisons'
import CustomersData from 'data/CustomerStories'
import SolutionsData from 'data/Solutions'

const ProductDropdown = () => {
  const { basePath } = useRouter()
  const isTablet = useBreakpoint(1279)

  return (
    <div className="flex flex-col xl:flex-row">
      <ul className="bg-background grid gap-2 py-6 px-6 grid-cols-2 xl:grid-cols-1 w-[700px] xl:w-[360px]">
        {Object.values(SolutionsData).map((component) => (
          <NavigationMenuLink key={component.name} asChild>
            <MenuItem
              title={component.name}
              href={component.url}
              description={component.description_short}
              icon={component.icon}
              className="h-fit"
              hasChevron
            />
          </NavigationMenuLink>
        ))}
      </ul>
      <div className="bg-overlay border-t xl:border-t-0 xl:border-l py-8 px-10 gap-8 grid grid-cols-5 xl:flex xl:flex-col w-full xl:w-[500px]">
        <div className="col-span-3 xl:w-auto">
          <Link
            href="/customers"
            className="group flex items-center gap-1 text-foreground-lighter hover:text-foreground text-xs uppercase tracking-widest font-mono mb-6 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-foreground-lighter focus-visible:ring-offset-4 focus-visible:ring-offset-background-alternative focus-visible:rounded-sm focus-visible:text-foreground"
          >
            Customer Stories
            <IconChevronRight className="h-3 w-3 transition-transform will-change-transform -translate-x-1 group-hover:translate-x-0" />
          </Link>
          <ul className="flex flex-col gap-2">
            {CustomersData.slice(0, isTablet ? 2 : 3).map((customer) => (
              <li key={customer.organization}>
                <Link
                  href={customer.url}
                  className="group flex items-center gap-3 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-foreground-lighter focus-visible:ring-offset-4 focus-visible:ring-offset-background-alternative focus-visible:rounded"
                >
                  <div className="relative rounded-md bg-background p-2 border group-hover:border-foreground-muted/50 h-16 w-32 flex-shrink-0 overflow-auto">
                    <Image
                      src={`${basePath}/${customer.imgUrl}`}
                      alt={customer.title}
                      fill
                      className="!p-4 object-contain brightness-70 contrast-[.35] filter"
                    />
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-light group-hover:text-foreground group-focus-visible:text-foreground text-normal mb-0 text-sm">
                      {customer.title}
                    </h4>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-span-2">
          <p className="text-foreground-lighter text-xs uppercase tracking-widest font-mono mb-6">
            {ComparisonsData.label}
          </p>
          <ul className="flex flex-col gap-2">
            {ComparisonsData.comparisons.map((link) => (
              <li key={link.text}>
                <TextLink
                  chevronAnimation="fadeIn"
                  url={link.url}
                  label={link.text}
                  className="mt-0 hover:text-foreground focus-visible:text-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-background-overlay"
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ProductDropdown
