'use client'

import * as Accordion from '@radix-ui/react-accordion'

import { type NavMenuSection } from '../Navigation.types'
import * as NavItems from './NavigationMenu.constants'
import NavigationMenuGuideListItems from './NavigationMenuGuideListItems'
import { usePathname } from 'next/navigation'

const NavigationMenuGuideList = ({
  id,
  additionalNavItems,
}: {
  id: string
  additionalNavItems?: Partial<NavMenuSection>[]
}) => {
  const pathname = usePathname()
  const firstLevelRoute = pathname?.split('/')?.slice(0, 4)?.join('/')

  let menu = NavItems[id]

  if (id === 'integrations' && additionalNavItems) {
    const integrationsListIndex = menu.items.findIndex((item) => item.name === 'Integrations')
    if (integrationsListIndex !== -1) {
      menu = {
        ...menu,
        items: [
          ...menu.items.slice(0, integrationsListIndex),
          {
            ...menu.items[integrationsListIndex],
            items: [...menu.items[integrationsListIndex].items, ...additionalNavItems],
          },
          ...menu.items.slice(integrationsListIndex + 1),
        ],
      }
    }
  }

  return (
    <Accordion.Root
      collapsible={true}
      key={id}
      type="single"
      value={firstLevelRoute}
      className="transition-all duration-150 ease-out opacity-100 ml-0 delay-150"
    >
      <NavigationMenuGuideListItems menu={menu} id={id} />
    </Accordion.Root>
  )
}

export default NavigationMenuGuideList
