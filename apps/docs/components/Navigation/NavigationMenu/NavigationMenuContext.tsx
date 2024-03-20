import { type PropsWithChildren, createContext, useMemo, useContext } from 'react'

import { type MenuId } from './menus'
import { type GuideRefItem } from './NavigationMenuGuideRef'

type NavMenuBase = {
  menuId: MenuId
  dualMenu: boolean
}

type NavMenuWithData = NavMenuBase & {
  dualMenu: true
  refData: Array<GuideRefItem>
}

type NavMenuContextValue = NavMenuBase | NavMenuWithData

type ConvertToProviderProps<T extends NavMenuContextValue> = Omit<T, '__identifier' | 'dualMenu'> &
  Pick<Partial<T>, 'dualMenu'>
type NavMenuProviderProps =
  | ConvertToProviderProps<NavMenuBase>
  | ConvertToProviderProps<NavMenuWithData>

const NavMenuContext = createContext<NavMenuContextValue | undefined>(undefined)

const NavMenuProvider = (props: PropsWithChildren<NavMenuProviderProps>) => {
  const menuId = props.menuId
  const refData = 'refData' in props ? props.refData : undefined

  const contextValue = useMemo(
    () =>
      !!refData
        ? ({
            menuId,
            dualMenu: true,
            refData,
          } satisfies NavMenuWithData)
        : ({
            menuId,
            dualMenu: props.dualMenu ?? false,
          } satisfies NavMenuBase),
    [props.dualMenu, menuId, refData]
  )

  return <NavMenuContext.Provider value={contextValue}>{props.children}</NavMenuContext.Provider>
}

const useNavMenu = () => {
  const context = useContext(NavMenuContext)
  if (!context) throw Error('`useNavMenu` must be used within a `NavMenuProvider`')

  return context
}

export { NavMenuProvider, useNavMenu }
