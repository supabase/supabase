import { type PropsWithChildren, createContext, useMemo, useContext } from 'react'

import { type MenuId } from './menus'
import { type GuideRefItem } from './NavigationMenuGuideRef'

type NavMenuWithId = {
  __identifier: 'id'
  menuId: MenuId
  dualMenu: boolean
}

type NavMenuWithData = {
  __identifier: 'data'
  refData: Array<GuideRefItem>
  dualMenu: boolean
}

type NavMenuContextValue = NavMenuWithId | NavMenuWithData

const isNavMenuWithId = (navMenu: NavMenuContextValue): navMenu is NavMenuWithId =>
  navMenu.__identifier === 'id'

type ConvertToProviderProps<T extends NavMenuContextValue> = Omit<T, '__identifier' | 'dualMenu'> &
  Pick<Partial<T>, 'dualMenu'>
type NavMenuProviderProps =
  | ConvertToProviderProps<NavMenuWithId>
  | ConvertToProviderProps<NavMenuWithData>

const NavMenuContext = createContext<NavMenuContextValue | undefined>(undefined)

const NavMenuProvider = (props: PropsWithChildren<NavMenuProviderProps>) => {
  const dualMenu = 'dualMenu' in props ? props.dualMenu : false
  const menuId = 'menuId' in props ? props.menuId : undefined
  const refData = 'refData' in props ? props.refData : undefined

  const contextValue = useMemo(
    () =>
      !!menuId
        ? ({
            __identifier: 'id',
            menuId,
            dualMenu,
          } satisfies NavMenuWithId)
        : ({
            __identifier: 'data',
            refData,
            dualMenu,
          } satisfies NavMenuWithData),
    [dualMenu, menuId, refData]
  )

  return <NavMenuContext.Provider value={contextValue}>{props.children}</NavMenuContext.Provider>
}

const useNavMenu = () => {
  const context = useContext(NavMenuContext)
  if (!context) throw Error('`useNavMenu` must be used within a `NavMenuProvider`')

  return context
}

export { NavMenuProvider, isNavMenuWithId, useNavMenu }
