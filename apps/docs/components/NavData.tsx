import { ReactNode } from 'react'

import { navDataForMdx } from './Navigation/NavigationMenu/NavigationMenu.constants'

export function NavData({
  data,
  children,
}: {
  data: keyof typeof navDataForMdx
  children: (navItems: (typeof navDataForMdx)[keyof typeof navDataForMdx]) => ReactNode
}) {
  const navItems = navDataForMdx[data]
  return children(navItems)
}
