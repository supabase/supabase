import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import Link from 'next/link'

import { IconChevronRight, TextLink } from 'ui'
import { NavigationMenuLink } from 'ui/src/components/shadcn/ui/navigation-menu'
import MenuItem from './MenuItem'

import ComparisonsData from 'data/Comparisons'
import CustomersData from 'data/CustomerStories'
import SolutionsData from 'data/Solutions'
import { useBreakpoint } from 'common'
import DropdownMenuItem from './DropdownMenuItem'

const ProductDropdown = () => {
  const { basePath } = useRouter()
  const isTablet = useBreakpoint(1279)

  return (
    <div className="flex flex-col xl:flex-row">
      <ul className="grid gap-1 py-8 px-7 w-[520px] xl:w-[380px]">
        {Object.values(SolutionsData).map((component) => (
          <NavigationMenuLink key={component.name} asChild>
            <DropdownMenuItem
              title={component.name}
              href={component.url}
              description={component.description_short}
              icon={component.icon}
              className="h-fit"
            />
          </NavigationMenuLink>
        ))}
      </ul>
      <div className="border-t xl:border-t-0 xl:border-l py-8 px-10 gap-2 xl:gap-8 grid grid-cols-3 xl:flex xl:flex-col w-full xl:w-[500px] bg-surface-200">
        <div className="col-span-2 xl:w-auto">
          <Link href="/customers">
            <a className="flex items-center gap-1 text-lighter hover:text-foreground text-xs uppercase tracking-widest font-mono mb-6 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-foreground-lighter focus-visible:ring-offset-4 focus-visible:ring-offset-background-alternative focus-visible:rounded-sm focus-visible:text-brand">
              Customer Stories
              <IconChevronRight className="h-3 w-3" />
            </a>
          </Link>
          <ul className="flex flex-col gap-3">
            {CustomersData.slice(0, isTablet ? 2 : 3).map((customer) => (
              <li key={customer.organization}>
                <Link href={customer.url}>
                  <a className="group flex gap-3 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-foreground-lighter focus-visible:ring-offset-4 focus-visible:ring-offset-background-alternative focus-visible:rounded">
                    <div className="relative rounded-md bg-overlay p-2 border h-16 w-32 flex-shrink-0 overflow-auto group-hover:border-control">
                      <Image
                        src={`${basePath}/${customer.imgUrl}`}
                        alt={customer.title}
                        layout="fill"
                        objectFit="contain"
                        className="!p-4 brightness-50 contrast-50 dark:contrast-0 group-hover:brightness-0 filter"
                      />
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-foreground-light group-hover:text-foreground group-focus-visible:text-brand mb-0 text-sm">
                        {customer.title}
                      </h4>
                    </div>
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-lighter text-xs uppercase tracking-widest font-mono mb-6">
            {ComparisonsData.label}
          </p>
          <ul className="flex flex-col gap-2">
            {ComparisonsData.comparisons.map((link) => (
              <li key={link.text}>
                <TextLink
                  hasChevron={false}
                  url={link.url}
                  label={link.text}
                  className="mt-0 hover:text-brand focus-visible:text-brand focus-visible:ring-offset-4 focus-visible:ring-offset-background-overlay"
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
