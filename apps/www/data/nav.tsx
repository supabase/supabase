import { DevelopersDropdown } from 'components/Nav/DevelopersDropdown'
import { ProductDropdown } from 'components/Nav/ProductDropdown'
import { SolutionsDropdown } from 'components/Nav/SolutionsDropdown'

import { data as DevelopersData } from 'data/Developers'
import MainProductsData from 'data/MainProducts'
import { navData as SolutionsData } from 'data/Solutions'

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
      title: 'Solutions',
      hasDropdown: true,
      dropdown: <SolutionsDropdown />,
      dropdownContainerClassName: 'rounded-xl',
      subMenu: SolutionsData,
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
