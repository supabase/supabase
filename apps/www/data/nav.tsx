import DevelopersDropdown from '~/components/Nav/DevelopersDropdown'
import ProductDropdown from '~/components/Nav/ProductDropdown'

import { data as DevelopersData } from 'data/Developers'
import SolutionsData from 'data/Solutions'

interface Props {
  [name: string]: {
    title: string
    hasDropdown?: boolean
    dropdown?: any
    dropdownContainerClassName?: string
    subMenu?: any
    url?: string
  }[]
}

export const menu: Props = {
  primaryNav: [
    {
      title: 'Product',
      hasDropdown: true,
      dropdown: ProductDropdown,
      dropdownContainerClassName: 'rounded-xl',
      subMenu: SolutionsData,
    },
    {
      title: 'Developers',
      hasDropdown: true,
      dropdown: DevelopersDropdown,
      dropdownContainerClassName: 'rounded-xl',
      subMenu: DevelopersData,
    },
    {
      title: 'Pricing',
      url: '/pricing',
    },
    {
      title: 'Docs',
      url: '/docs',
    },
    {
      title: 'Blog',
      url: '/blog',
    },
  ],
}
