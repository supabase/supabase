'use client'

import * as Accordion from '@radix-ui/react-accordion'

import * as NavItems from './NavigationMenu.constants'
import NavigationMenuGuideListItems from './NavigationMenuGuideListItems'
import { usePathname } from 'next/navigation'

const NavigationMenuGuideList = ({ id }: { id: string }) => {
  const pathname = usePathname()
  const firstLevelRoute = pathname?.split('/')?.slice(0, 4)?.join('/')

  const menu = NavItems[id]

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
