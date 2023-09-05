import React from 'react'
import { ListItem } from '.'

import SolutionsData from 'data/Solutions'

const Product = () => (
  <ul className="grid w-[400px] gap-2 p-2 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
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
)

export default Product
