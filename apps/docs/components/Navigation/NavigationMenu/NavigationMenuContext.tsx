import { type PropsWithChildren, createContext, useMemo, useContext } from 'react'

import { type MenuId } from './menus'
import { type GuideRefItem } from './NavigationMenuGuideRef'

type NavMenuContextValue = {
  menuId: MenuId
  refData?: Array<GuideRefItem>
}

const NavMenuContext = createContext<NavMenuContextValue | undefined>(undefined)

const NavMenuProvider = ({ children, menuId }: PropsWithChildren<NavMenuContextValue>) => {
  const contextValue = useMemo(
    () => ({
      menuId,
    }),
    [menuId]
  )

  return <NavMenuContext.Provider value={contextValue}>{children}</NavMenuContext.Provider>
}

const useNavMenu = () => {
  const context = useContext(NavMenuContext)
  if (!context) throw Error('`useNavMenu` must be used within a `NavMenuProvider`')

  return context
}

export { NavMenuProvider, useNavMenu }
