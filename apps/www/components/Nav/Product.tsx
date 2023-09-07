import React from 'react'

import SolutionsData from 'data/Solutions'
import ComparisonsData from 'data/Comparisons'
import CustomersData from 'data/CustomerStories'
import { TextLink } from 'ui'
import { NavigationMenuLink } from 'ui/src/components/shadcn/ui/navigation-menu'
import MenuItem from './MenuItem'

const Product = () => (
  <>
    <ul className="grid gap-2 xl:grid-cols-2 p-2 w-[300px] xl:w-[600px]">
      {Object.values(SolutionsData).map((component) => (
        <NavigationMenuLink key={component.name} asChild>
          <MenuItem
            title={component.name}
            href={component.url}
            description={component.description_short}
            icon={component.icon}
          />
        </NavigationMenuLink>
      ))}
    </ul>
    <div className="bg-alternative flex flex-col gap-6 p-4 w-[250px]">
      <div>
        <p className="text-muted text-xs uppercase tracking-widest font-mono mb-2 block">
          Customer Stories
        </p>
        <ul className="flex flex-col gap-2">
          {CustomersData.slice(0, 3).map((customer) => (
            <li key={customer.organization}>
              <TextLink
                hasChevron={false}
                url={customer.url}
                label={customer.organization}
                className="mt-0 focus-visible:ring-offset-4 focus-visible:ring-offset-background-overlay"
              />
            </li>
          ))}
        </ul>
        <TextLink
          url="/customers"
          label="View all"
          className="text-lighter text-xs focus-visible:ring-offset-4 focus-visible:ring-offset-background-overlay"
        />
      </div>
      <div>
        <p className="text-muted text-xs uppercase tracking-widest font-mono mb-2">
          {ComparisonsData.label}
        </p>
        <ul className="flex flex-col gap-2">
          {ComparisonsData.comparisons.map((link) => (
            <li key={link.text}>
              <TextLink
                hasChevron={false}
                url={link.url}
                label={link.text}
                className="mt-0 focus-visible:ring-offset-4 focus-visible:ring-offset-background-overlay"
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  </>
)

export default Product
