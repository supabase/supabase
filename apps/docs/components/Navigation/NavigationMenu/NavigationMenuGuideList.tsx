import * as Accordion from '@radix-ui/react-accordion'
import { useRouter } from 'next/router'

import * as NavItems from './NavigationMenu.constants'
import { getPathWithoutHash } from './NavigationMenu.utils'
import NavigationMenuGuideListItems from './NavigationMenuGuideListItems'

const NavigationMenuGuideList = ({ id }: { id: string }) => {
  const path = useRouter().asPath
  const url = getPathWithoutHash(path)
  const firstLevelRoute = url?.split('/')?.slice(0, 4)?.join('/')

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
