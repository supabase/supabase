import React from 'react'
import SolutionsData from 'data/Solutions'
import CustomerStoriesData from 'data/CustomerStories.json'
import { useRouter } from 'next/router'
import ProductIcon from '../ProductIcon'
import { Badge } from 'ui'
import Image from 'next/image'
import Link from 'next/link'
import TextLink from '../TextLink'
import { ListItem } from '.'

const Product = () => {
  const { basePath } = useRouter()

  return (
    <ul className="grid w-[400px] gap-3 p-2 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
      {Object.values(SolutionsData).map((component) => (
        <ListItem
          key={component.name}
          title={component.name}
          href={component.url}
          description={component.description_short}
        />
      ))}
    </ul>
  )
}

export default Product
