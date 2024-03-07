import { memo } from 'react'

import NavigationMenuHome from './HomeMenu'
import NavigationMenuGuideList from './NavigationMenuGuideList'
import NavigationMenuRefList from './NavigationMenuRefList'
import { type Menu, MenuId, menus } from './menus'

function getMenuById(id: MenuId) {
  return menus.find((menu) => menu.id === id) ?? menus.find((menu) => menu.id === MenuId.Home)
}

function getMenuElement(menu: Menu, refId?: string) {
  const menuType = menu.type
  switch (menuType) {
    case 'home':
      return <NavigationMenuHome />
    case 'guide':
      return <NavigationMenuGuideList id={menu.id} refId={refId} />
    case 'reference':
      return (
        <NavigationMenuRefList
          id={menu.id}
          basePath={menu.path}
          commonSectionsFile={menu.commonSectionsFile}
          specFile={menu.specFile}
        />
      )
    default:
      throw new Error(`Unknown menu type '${menuType}'`)
  }
}

const NavigationMenu = ({ menuId, refId }: { menuId: MenuId; refId?: string }) => {
  const level = menuId
  const menu = getMenuById(level)

  return getMenuElement(menu, refId)
}

export { MenuId, menus }
export default memo(NavigationMenu)
