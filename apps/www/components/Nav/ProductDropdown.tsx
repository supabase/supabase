import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ChevronRight, Sparkles } from 'lucide-react'

import { useBreakpoint } from 'common'
import { TextLink } from 'ui'
import { NavigationMenuLink } from 'ui/src/components/shadcn/ui/navigation-menu'
import MenuItem from './MenuItem'

import ComparisonsData from '~/data/Comparisons'
import CustomersData from '~/data/CustomerStories'
import MainProductsData from '~/data/MainProducts'
import ProductModulesData from '~/data/ProductModules'

const ProductDropdown = () => {
  const { basePath } = useRouter()
  const isTablet = useBreakpoint(1279)

  return (
    <div className="flex flex-col xl:flex-row">
      <div className="flex flex-col">
        <div className="flex flex-row py-6 px-6 gap-2">
          <ul className="flex flex-col gap-4 w-[280px] xl:w-[250px]">
            {Object.values(MainProductsData)
              .filter((product) => product.name !== 'Vector')
              .map((product) => (
                <NavigationMenuLink key={product.name} asChild>
                  <MenuItem
                    title={product.name}
                    href={product.url}
                    description={product.description_short}
                    icon={product.icon}
                    className="h-fit p-0"
                    hasChevron
                  />
                </NavigationMenuLink>
              ))}
          </ul>
          <div className="flex flex-col gap-4 w-[250px]">
            <div className="group flex items-center gap-1 text-foreground-lighter text-xs uppercase tracking-widest font-mono">
              Modules
            </div>
            <ul className="flex flex-col gap-4">
              {Object.values(ProductModulesData).map((productModule) => (
                <NavigationMenuLink key={productModule.name} asChild>
                  <Link
                    href={productModule.url}
                    className="
                    h-fit group/menu-item
                    flex items-start gap-2
                    text-xs leading-none
                    text-foreground-light hover:text-foreground
                    no-underline outline-none select-none
                    focus-visible:ring-2 focus-visible:ring-foreground-lighter focus-visible:text-foreground
                    "
                  >
                    <div className="w-8 h-8 min-w-8 shrink-0 bg-background border flex items-center justify-center rounded-md">
                      <svg
                        className="h-4 w-4 group-hover/menu-item:text-foreground group-focus-visible/menu-item:text-foreground"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d={productModule.icon}
                          stroke="currentColor"
                        />
                      </svg>
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className="flex items-center gap-1">
                        <p className="leading-snug text-foreground">{productModule.name}</p>
                        <ChevronRight
                          strokeWidth={2}
                          className="w-3 h-3 text-foreground transition-all will-change-transform -translate-x-1 opacity-0 group-hover/menu-item:translate-x-0 group-hover/menu-item:opacity-100"
                        />
                      </div>
                      {productModule.description_short && (
                        <p className="line-clamp-2 leading-tight text-foreground-lighter group-hover/menu-item:text-foreground-light group-focus-visible/menu-item:text-foreground-light">
                          {productModule.description_short}
                        </p>
                      )}
                    </div>
                  </Link>
                </NavigationMenuLink>
              ))}
            </ul>
            <div className="pt-4 border-t">
              <Link
                href="/features"
                className="
                h-fit group/menu-item
                flex items-start gap-2
                text-xs leading-none
                text-foreground-light hover:text-foreground
                no-underline outline-none select-none
                focus-visible:ring-2 focus-visible:ring-foreground-lighter focus-visible:text-foreground
              "
              >
                <div className="w-8 h-8 min-w-8 shrink-0 bg-background border flex items-center justify-center rounded-md">
                  <Sparkles size={16} strokeWidth={1.3} />
                </div>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-1">
                    <p className="leading-snug text-foreground">Features</p>
                    <ChevronRight
                      strokeWidth={2}
                      className="w-3 h-3 text-foreground transition-all will-change-transform -translate-x-1 opacity-0 group-hover/menu-item:translate-x-0 group-hover/menu-item:opacity-100"
                    />
                  </div>
                  <span className="line-clamp-2 leading-tight text-foreground-lighter group-hover/menu-item:text-foreground-light group-focus-visible/menu-item:text-foreground-light">
                    Explore everything you can do with Supabase.
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-surface-75 border-t xl:border-t-0 xl:border-l p-6 gap-8 grid grid-cols-5 xl:flex xl:flex-col w-full xl:w-[350px]">
        <div className="col-span-3 flex flex-col gap-8 xl:w-auto">
          <div>
            <Link
              href="/customers"
              className="group flex items-center gap-1 text-foreground-lighter hover:text-foreground text-xs uppercase tracking-widest font-mono mb-4 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-foreground-lighter focus-visible:ring-offset-4 focus-visible:ring-offset-background-alternative focus-visible:rounded-sm focus-visible:text-foreground"
            >
              Customer Stories
              <ChevronRight className="h-3 w-3 transition-transform will-change-transform -translate-x-1 group-hover:translate-x-0" />
            </Link>
            <ul className="flex flex-col gap-2">
              {CustomersData.slice(0, isTablet ? 2 : 1).map((customer) => (
                <li key={customer.organization}>
                  <Link
                    href={customer.url}
                    className="group flex items-center gap-3 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-foreground-lighter focus-visible:ring-offset-4 focus-visible:ring-offset-background-alternative focus-visible:rounded"
                  >
                    <div className="relative rounded-md bg-background border group-hover:border-foreground-muted/50 h-14 w-28 xl:h-14 xl:w-20 flex-shrink-0 overflow-auto">
                      <Image
                        src={`${basePath}/${customer.imgUrl}`}
                        alt={customer.title}
                        fill
                        className="!p-3 object-contain brightness-70 contrast-[.35] filter"
                      />
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-light group-hover:text-foreground group-focus-visible:text-foreground text-normal mb-0 text-sm line-clamp-3 leading-tight">
                        {customer.title}
                      </h4>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-span-2 grid grid-cols-1 gap-6 xl:gap-2">
          <div>
            <p className="text-foreground-lighter text-xs uppercase tracking-widest font-mono mb-3">
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
    </div>
  )
}

export default ProductDropdown
