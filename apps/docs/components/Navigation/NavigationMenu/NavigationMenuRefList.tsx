import { memo } from 'react'

import NavigationMenuRefListItems, { type RefMenuCategory } from './NavigationMenuRefListItems'

interface NavigationMenuRefListProps {
  id: string
  menuData: Array<RefMenuCategory>
}

const NavigationMenuRefList = ({ id, menuData }: NavigationMenuRefListProps) => {
  return (
    <div className="transition-all duration-150 ease-out opacity-100 ml-0 delay-150 h-auto">
      <NavigationMenuRefListItems id={id} menuData={menuData} />
    </div>
  )
}

export default memo(NavigationMenuRefList)
