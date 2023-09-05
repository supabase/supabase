import React from 'react'
import { ListItem } from '.'

import SolutionsData from 'data/Solutions'
import ComparisonsData from 'data/Comparisons'
import { TextLink } from 'ui'

const Product = () => (
  <>
    {/* <ul className="grid gap-2 p-2 xl:grid-cols-2 w-[300px] xl:w-[600px] "> */}
    <ul className="grid gap-2 p-2 2xl:grid-cols-2 w-[300px] 2xl:w-[600px] ">
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
    <ul className="bg-alternative flex flex-col p-4 w-[250px]">
      <label className="text-muted text-xs font-mono mb-1">{ComparisonsData.label}</label>
      {ComparisonsData.comparisons.map((link) => (
        <li key={link.text}>
          <TextLink
            url={link.url}
            label={link.text}
            className="focus-visible:ring-offset-4 focus-visible:ring-offset-background-overlay"
          />
        </li>
      ))}
    </ul>
  </>
)

export default Product
