import DevelopersDropdown from '~/components/Nav/DevelopersDropdown'
import ProductDropdown from '~/components/Nav/ProductDropdown'

import { data as DevelopersData } from 'data/Developers'
import SolutionsData from 'data/Solutions'

export const menu = {
  primaryNav: [
    {
      title: 'Product',
      hasDropdown: true,
      dropdown: <ProductDropdown />,
      dropdownContainerClassName: 'rounded-lg flex flex-col xl:flex-row',
      subMenu: SolutionsData,
    },
    {
      title: 'Developers',
      hasDropdown: true,
      dropdown: <DevelopersDropdown />,
      dropdownContainerClassName: 'rounded-lg flex flex-col xl:flex-row',
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
