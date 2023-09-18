import React from 'react'

import SolutionsData from 'data/Solutions'
import ComparisonsData from 'data/Comparisons'
import CustomersData from 'data/CustomerStories'
import { IconChevronRight, TextLink } from 'ui'
import { NavigationMenuLink } from 'ui/src/components/shadcn/ui/navigation-menu'
import MenuItem from './MenuItem'
import Image from 'next/image'
import { useRouter } from 'next/router'
import Link from 'next/link'

const ProductDropdown = () => {
  const { basePath } = useRouter()

  return (
    <>
      <ul className="grid gap-2 p-6 grid-cols-1 w-[330px]">
        {Object.values(SolutionsData).map((component) => (
          <NavigationMenuLink key={component.name} asChild>
            <MenuItem
              title={component.name}
              href={component.url}
              description={component.description_short}
              icon={component.icon}
              className="h-fit"
            />
          </NavigationMenuLink>
        ))}
      </ul>
      <div className="border-l flex flex-col w-[500px] bg-alternative">
        <div className="p-6">
          <Link href="/customers">
            <a className="inline-flex items-center gap-1 text-muted hover:text-brand text-xs uppercase tracking-widest font-mono mb-6">
              Customer Stories
              <IconChevronRight className="h-3 w-3" />
            </a>
          </Link>
          <ul className="flex flex-col gap-3">
            {CustomersData.slice(0, 3).map((customer) => (
              <li key={customer.organization}>
                <Link href={customer.url}>
                  <a className="group flex items-center gap-3">
                    <div className="relative rounded-md bg-overlay p-2 border h-16 w-32 flex-shrink-0 overflow-auto">
                      <Image
                        src={`${basePath}/${customer.imgUrl}`}
                        alt={customer.title}
                        layout="fill"
                        objectFit="contain"
                        className="!p-3 dark:brightness-200 dark:contrast-0 dark:filter"
                      />
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-light group-hover:text-brand text-normal mb-0 text-sm">
                        {customer.title}
                      </h4>
                    </div>
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t p-6">
          <p className="text-muted text-xs uppercase tracking-widest font-mono mb-6">
            {ComparisonsData.label}
          </p>
          <ul className="flex flex-col gap-2">
            {ComparisonsData.comparisons.map((link) => (
              <li key={link.text}>
                <TextLink
                  hasChevron={false}
                  url={link.url}
                  label={link.text}
                  className="mt-0 hover:text-brand focus-visible:ring-offset-4 focus-visible:ring-offset-background-overlay"
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}

export default ProductDropdown
