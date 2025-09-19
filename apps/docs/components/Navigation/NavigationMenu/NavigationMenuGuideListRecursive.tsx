'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { type PropsWithChildren } from 'react'
import * as Accordion from '@radix-ui/react-accordion'

import { type NavMenuSection } from '../Navigation.types'
import * as NavItems from './NavigationMenu.constants'
import { transformNavMenuToMenuItems } from './navigationDataTransform'
import RecursiveNavigation, { type MenuItem } from './RecursiveNavigation'
import MenuIconPicker from './MenuIconPicker'
import { MenuId } from './NavigationMenu'

interface NavigationMenuGuideListRecursiveProps {
  id: string
  additionalNavItems?: Record<string, Partial<NavMenuSection>[]>
}

const NavigationMenuGuideListRecursive = ({
  id,
  additionalNavItems,
}: NavigationMenuGuideListRecursiveProps) => {
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

  const menuItems: MenuItem[] = transformNavMenuToMenuItems([
    {
      label: menu.title,
      items: menu.items.filter((item) => item.enabled !== false),
    },
  ])

  return (
    <NavigationMenuGuideListWrapper id={id}>
      <div className="w-full flex flex-col gap-0 pb-5">
        {/* Header */}
        <Link href={menu.url ?? ''}>
          <div className="flex items-center gap-3 my-3 text-brand-link">
            <MenuIconPicker icon={menu.icon} />
            <span className="text-base text-brand-600">{menu.title}</span>
          </div>
        </Link>

        <RecursiveNavigation 
          items={menuItems[0].children || []} 
          className="space-y-1"
        />
      </div>
    </NavigationMenuGuideListWrapper>
  )
}

export function NavigationMenuGuideListWrapper({
  id,
  children,
}: PropsWithChildren<{
  id: string
}>) {
  const pathname = usePathname()
  const firstLevelRoute = pathname?.split('/')?.slice(0, 4)?.join('/')

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

export default NavigationMenuGuideListRecursive
