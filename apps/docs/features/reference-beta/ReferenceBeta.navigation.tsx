'use client'

import { NavigationMenuGuideListWrapper } from '~/components/Navigation/NavigationMenu/NavigationMenuGuideList'
import NavigationMenuGuideListItems from '~/components/Navigation/NavigationMenu/NavigationMenuGuideListItems'

export interface ReferenceBetaNavMenu {
  title: string
  url: string
  icon?: string
  items: {
    name: string
    url?: string
    items?: { name: string; url: string }[]
  }[]
}

/**
 * Left sidebar: the same list the guides use, with the library's definitions
 * grouped by category.
 */
export function ReferenceBetaNavigation({ id, menu }: { id: string; menu: ReferenceBetaNavMenu }) {
  return (
    <NavigationMenuGuideListWrapper id={id}>
      <NavigationMenuGuideListItems menu={menu} id={id} />
    </NavigationMenuGuideListWrapper>
  )
}
