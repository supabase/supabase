'use client'

import { useBreakpoint } from 'common'
import { ChevronRight, Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { NavigationMenuLink } from 'ui'
import { TextLink } from 'ui-patterns/TextLink'

import MenuItem from './MenuItem'
import ComparisonsData from '@/data/Comparisons'
import CustomersData from '@/data/CustomerStories'
import MainProductsData from '@/data/MainProducts'
import ProductModulesData from '@/data/ProductModules'

export const ProductDropdown = () => {
  const isTablet = useBreakpoint(1279)

  return (
    <div className="flex flex-col lg:flex-row">
      <div className="flex flex-col bg-surface-75">
        <div className="flex flex-row p-6 pt-5 gap-6">
          <div className="flex flex-col gap-4 w-[280px] lg:w-[250px]">
            <div className="flex items-center gap-1 text-foreground-lighter text-xs uppercase tracking-widest font-mono">
              Products
            </div>
            <ul className="flex flex-col gap-4">
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
          </div>
          <div className="flex flex-col gap-4 w-72">
            <div className="group flex items-center gap-1 text-foreground-lighter text-xs uppercase tracking-widest font-mono">
              Modules
            </div>
            <ul className="flex flex-col gap-4">
              {Object.values(ProductModulesData).map((productModule) => (
                <NavigationMenuLink key={productModule.name} asChild>
                  <MenuItem
                    title={productModule.name}
                    href={productModule.url}
                    description={productModule.description_short}
                    icon={productModule.icon}
                    className="h-fit p-0"
                    hasChevron
                  />
                </NavigationMenuLink>
              ))}
              <Link
                href="/features"
                className="
                h-fit group/menu-item
                flex items-center gap-3
                text-sm leading-none
                text-foreground-light hover:text-foreground
                no-underline select-none
                focus-ring focus-visible:text-foreground
              "
              >
                <div className="w-10 h-10 min-w-10 shrink-0 bg-surface-200 border flex items-center justify-center rounded-lg">
                  <Sparkles size={20} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-1">
                    <p className="leading-snug text-foreground">Features</p>
                    <ChevronRight
                      strokeWidth={2}
                      className="w-3 h-3 text-foreground transition-all will-change-transform -translate-x-1 opacity-0 group-hover/menu-item:translate-x-0 group-hover/menu-item:opacity-100"
                    />
                  </div>
                  <span className="line-clamp-2 leading-snug text-xs text-foreground-lighter group-hover/menu-item:text-foreground-light group-focus-visible/menu-item:text-foreground-light">
                    Explore everything you can do with Supabase.
                  </span>
                </div>
              </Link>
            </ul>
          </div>
        </div>
      </div>
      <div className="bg-surface-75 border-t lg:border-t-0 lg:border-l p-6 gap-8 flex flex-col w-full lg:flex-1">
        <div className="col-span-3 flex flex-row gap-8 lg:w-auto">
          <div>
            <Link
              href="/customers"
              className="group flex items-center gap-1 text-foreground-lighter hover:text-foreground text-xs uppercase tracking-widest font-mono mb-4 focus-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background-alternative rounded-xs focus-visible:text-foreground"
            >
              Customer Stories
              <ChevronRight className="h-3 w-3 transition-transform will-change-transform -translate-x-1 group-hover:translate-x-0" />
            </Link>
            <ul className="flex flex-row gap-2">
              {CustomersData.slice(0, isTablet ? 1 : 1).map((customer) => (
                <li key={customer.organization}>
                  <Link
                    href={customer.url}
                    className="group flex items-center gap-3 focus-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background-alternative rounded-sm"
                  >
                    <div className="relative rounded-md bg-background border group-hover:border-foreground-muted/50 h-14 w-28 lg:h-14 lg:w-20 shrink-0 overflow-auto">
                      <Image
                        src={`/${customer.imgUrl}`}
                        alt={customer.title}
                        fill
                        className="p-3! object-contain brightness-70 contrast-[.35] filter"
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
        <div className="w-full">
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
  )
}
