'use client'

import { NavigationMenuGuideListWrapper } from '~/components/Navigation/NavigationMenu/NavigationMenuGuideList'
import NavigationMenuGuideListItems from '~/components/Navigation/NavigationMenu/NavigationMenuGuideListItems'

export interface ReferenceBetaNavItem {
  name: string
  url?: string
  items?: ReferenceBetaNavItem[]
}

export interface ReferenceBetaNavMenu {
  title: string
  url: string
  icon?: string
  items: ReferenceBetaNavItem[]
}

/**
 * Left sidebar: the same list the guides use, with the library's definitions
 * grouped by category, and by subcategory within a category.
 */
export function ReferenceBetaNavigation({ id, menu }: { id: string; menu: ReferenceBetaNavMenu }) {
  return (
    <NavigationMenuGuideListWrapper id={id}>
      <NavigationMenuGuideListItems menu={menu} id={id} />
    </NavigationMenuGuideListWrapper>
  )
}
