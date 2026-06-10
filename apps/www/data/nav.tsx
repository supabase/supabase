import { DevelopersDropdown } from 'components/Nav/DevelopersDropdown'
import { ProductDropdown } from 'components/Nav/ProductDropdown'
import { SolutionsDropdown } from 'components/Nav/SolutionsDropdown'
import { data as DevelopersData } from 'data/Developers'
import MainProductsData from 'data/MainProducts'
import { navData as SolutionsData } from 'data/Solutions'

export type Menu = ReturnType<typeof getMenu>

export const getMenu = () => ({
  primaryNav: [
    {
      title: 'Product' as const,
      hasDropdown: true,
      dropdown: <ProductDropdown />,
      dropdownContainerClassName: 'rounded-xl',
      subMenu: MainProductsData,
    },
    {
      title: 'Developers' as const,
      hasDropdown: true,
      dropdown: <DevelopersDropdown />,
      dropdownContainerClassName: 'rounded-xl',
      subMenu: DevelopersData,
    },
    {
      title: 'Solutions' as const,
      hasDropdown: true,
      dropdown: <SolutionsDropdown />,
      dropdownContainerClassName: 'rounded-xl',
      subMenu: SolutionsData,
    },
    {
      title: 'Pricing' as const,
      url: '/pricing',
    },
    {
      title: 'Docs' as const,
      url: '/docs',
    },
    {
      title: 'Blog' as const,
      url: '/blog',
    },
  ],
})
