import { memo } from 'react'
import NavigationMenuHome from './HomeMenu'
import { MenuId, menus } from './menus'
import NavigationMenuGuideList from './NavigationMenuGuideList'
import NavigationMenuRefList from './NavigationMenuRefList'
import { type RefMenuCategory } from './NavigationMenuRefListItems'

interface BaseMenu {
  id: MenuId
  type: string
}

interface HomeMenu extends BaseMenu {
  type: 'home'
}

interface GuideMenu extends BaseMenu {
  type: 'guide'
}

interface ReferenceMenu extends BaseMenu {
  type: 'reference'
  path: string
  commonSectionsFile: string
  specFile?: string
}

type Menu = HomeMenu | GuideMenu | ReferenceMenu

function getMenuById(id: MenuId) {
  return menus.find((menu) => menu.id === id) ?? menus.find((menu) => menu.id === MenuId.Home)
}

function getMenuElement(menu: Menu, menuData?: Array<RefMenuCategory>) {
  const menuType = menu.type
  switch (menuType) {
    case 'home':
      return <NavigationMenuHome />
    case 'guide':
      return <NavigationMenuGuideList id={menu.id} />
    case 'reference':
      return <NavigationMenuRefList id={menu.id} menuData={menuData} />
    default:
      throw new Error(`Unknown menu type '${menuType}'`)
  }
}

const NavigationMenu = ({
  menuId,
  menuData,
}: {
  menuId: MenuId
  menuData?: Array<RefMenuCategory>
}) => {
  const level = menuId
  const menu = getMenuById(level)

  return getMenuElement(menu, menuData)
}

export { MenuId }
export default memo(NavigationMenu)
