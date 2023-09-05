import React from 'react'
import { ListItem } from '.'

import SolutionsData from 'data/Solutions'
import ComparisonsData from 'data/Comparisons'
import CustomersData from 'data/CustomerStories'
import { TextLink } from 'ui'

const aside = [CustomersData, ComparisonsData]

const Product = () => (
  <>
    {/* <ul className="grid gap-2 p-2 xl:grid-cols-2 w-[300px] xl:w-[600px] "> */}
    <ul className="grid gap-2 p-2 w-[300px]">
      {Object.values(SolutionsData).map((component) => (
        <ListItem
          key={component.name}
          title={component.name}
          href={component.url}
          description={component.description_short}
          icon={component.icon}
        />
      ))}
    </ul>
    <div className="bg-alternative flex flex-col gap-6 p-4 w-[250px]">
      <div>
        <p className="text-muted text-xs font-mono mb-1 block">Customer Stories</p>
        <ul>
          {CustomersData.slice(0, 3).map((customer) => (
            <li key={customer.organization}>
              <TextLink
                hasChevron={false}
                url={customer.url}
                label={customer.organization}
                className="focus-visible:ring-offset-4 focus-visible:ring-offset-background-overlay"
              />
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-muted text-xs font-mono mb-1">{ComparisonsData.label}</p>
        <ul>
          {ComparisonsData.comparisons.map((link) => (
            <li key={link.text}>
              <TextLink
                hasChevron={false}
                url={link.url}
                label={link.text}
                className="focus-visible:ring-offset-4 focus-visible:ring-offset-background-overlay"
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  </>
)

export default Product
