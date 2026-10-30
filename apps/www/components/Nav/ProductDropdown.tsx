'use client'

import { Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import {
  TopNavMenuGroup,
  TopNavMenuGroupLink,
  TopNavMenuPanel,
} from 'ui-patterns/TopNav/TopNavMenu'

import { getLinkComponent, MenuItemContent } from './MenuItem'
import ComparisonsData from '@/data/Comparisons'
import CustomersData from '@/data/CustomerStories'
import MainProductsData from '@/data/MainProducts'
import ProductModulesData from '@/data/ProductModules'

export const ProductDropdown = () => {
  const [customer] = CustomersData

  return (
    <TopNavMenuPanel>
      <TopNavMenuGroup label="Features">
        {Object.values(MainProductsData)
          .filter((product) => product.name !== 'Vector')
          .map((product) => (
            <TopNavMenuGroupLink
              key={product.name}
              linkAs={getLinkComponent(product.url)}
              href={product.url}
              className="group/menu-item gap-3"
            >
              <MenuItemContent
                title={product.name}
                description={product.description_short}
                icon={product.icon}
                hasChevron
                badge={
                  product.name === 'Compute'
                    ? { label: 'Private Alpha', variant: 'default' }
                    : undefined
                }
              />
            </TopNavMenuGroupLink>
          ))}
      </TopNavMenuGroup>
      <TopNavMenuGroup label="Modules">
        {Object.values(ProductModulesData).map((productModule) => (
          <TopNavMenuGroupLink
            key={productModule.name}
            linkAs={getLinkComponent(productModule.url)}
            href={productModule.url}
            className="group/menu-item gap-3"
          >
            <MenuItemContent
              title={productModule.name}
              description={productModule.description_short}
              icon={productModule.icon}
              hasChevron
            />
          </TopNavMenuGroupLink>
        ))}
        <TopNavMenuGroupLink linkAs={Link} href="/features" className="group/menu-item gap-3">
          <MenuItemContent
            title="Features"
            description="Explore everything you can do with Supabase."
            icon={<Sparkles size={20} strokeWidth={1.5} />}
            hasChevron
          />
        </TopNavMenuGroupLink>
      </TopNavMenuGroup>
      <TopNavMenuGroup label="Customer stories">
        <TopNavMenuGroupLink linkAs={Link} href={customer.url} className="gap-3">
          <span className="relative h-14 w-20 shrink-0 rounded-md border bg-background">
            <Image
              src={`/${customer.imgUrl}`}
              alt={customer.title}
              fill
              className="p-3! object-contain brightness-70 contrast-[.35] filter"
            />
          </span>
          <span className="line-clamp-3 leading-tight">{customer.title}</span>
        </TopNavMenuGroupLink>
        <TopNavMenuGroupLink linkAs={Link} href="/customers">
          All customer stories
        </TopNavMenuGroupLink>
      </TopNavMenuGroup>
      <TopNavMenuGroup label={ComparisonsData.label}>
        {ComparisonsData.comparisons.map((link) => (
          <TopNavMenuGroupLink key={link.text} linkAs={getLinkComponent(link.url)} href={link.url}>
            {link.text}
          </TopNavMenuGroupLink>
        ))}
      </TopNavMenuGroup>
    </TopNavMenuPanel>
  )
}
