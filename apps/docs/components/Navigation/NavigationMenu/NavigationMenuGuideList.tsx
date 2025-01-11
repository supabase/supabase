'use client'

import * as Accordion from '@radix-ui/react-accordion'

import { type NavMenuSection } from '../Navigation.types'
import * as NavItems from './NavigationMenu.constants'
import NavigationMenuGuideListItems from './NavigationMenuGuideListItems'
import { usePathname } from 'next/navigation'
import { PropsWithChildren } from 'react'
import { MenuId } from './NavigationMenu'

const NavigationMenuGuideList = ({
  id,
  additionalNavItems,
}: {
  id: string
  additionalNavItems?: Record<string, Partial<NavMenuSection>[]>
}) => {
  const pathname = usePathname()
  const firstLevelRoute = pathname?.split('/')?.slice(0, 4)?.join('/')

  // eslint-disable-next-line import/namespace -- dynamic access, can't lint properly
  let menu = NavItems[id]

  if (id === MenuId.Integrations && additionalNavItems?.integrations) {
    const integrationsListIndex = menu.items.findIndex((item) => item.name === 'Integrations')
    if (integrationsListIndex !== -1) {
      menu = {
        ...menu,
        items: [
          ...menu.items.slice(0, integrationsListIndex),
          {
            ...menu.items[integrationsListIndex],
            items: [...menu.items[integrationsListIndex].items, ...additionalNavItems.integrations],
          },
          ...menu.items.slice(integrationsListIndex + 1),
        ],
      }
    }
  }

  if (id === MenuId.GettingStarted && additionalNavItems?.prompts) {
    const promptsSectionIndex = menu.items.findIndex((item) => item.name === 'AI Prompts')
    if (promptsSectionIndex !== -1) {
      menu = {
        ...menu,
        items: [
          ...menu.items.slice(0, promptsSectionIndex),
          {
            ...menu.items[promptsSectionIndex],
            items: [...menu.items[promptsSectionIndex].items, ...additionalNavItems.prompts],
          },
          ...menu.items.slice(promptsSectionIndex + 1),
        ],
      }
    }
  }

  return (
    <NavigationMenuGuideListWrapper id={id} firstLevelRoute={firstLevelRoute}>
      <NavigationMenuGuideListItems menu={menu} id={id} />
    </NavigationMenuGuideListWrapper>
  )
}

export function NavigationMenuGuideListWrapper({
  id,
  firstLevelRoute,
  children,
}: PropsWithChildren<{
  id: string
  firstLevelRoute?: string
}>) {
  return (
    <Accordion.Root
      collapsible={true}
      key={id}
      type="single"
      value={firstLevelRoute}
      className="transition-all duration-150 ease-out opacity-100 ml-0 delay-150"
    >
      {children}
    </Accordion.Root>
  )
}

export default NavigationMenuGuideList
