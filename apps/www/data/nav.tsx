import DevelopersDropdown from '~/components/Nav/DevelopersDropdown'
import ProductDropdown from '~/components/Nav/ProductDropdown'

import { data as DevelopersData } from 'data/Developers'
import MainProductsData from '~/data/MainProducts'

export const getMenu = () => ({
  primaryNav: [
    {
      title: 'Product',
      hasDropdown: true,
      dropdown: <ProductDropdown />,
      dropdownContainerClassName: 'rounded-xl',
      subMenu: MainProductsData,
    },
    {
      title: 'Developers',
      hasDropdown: true,
      dropdown: <DevelopersDropdown />,
      dropdownContainerClassName: 'rounded-xl',
      subMenu: DevelopersData,
    },
    {
      title: 'Enterprise',
      url: '/enterprise',
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
})
