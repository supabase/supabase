import { proxy, useSnapshot } from 'valtio'

export const menuState = proxy({
  // values
  menuActiveRefId: 'home',
  // set states
  setMenuActiveRefId: (value) => {
    menuState.menuActiveRefId = value
  },
  menuMobileOpen: false,
  setMenuMobileOpen: (value) => {
    menuState.menuMobileOpen = value
  },
})

export const useMenuActiveRefId = () => {
  return useSnapshot(menuState).menuActiveRefId
}

export const useMenuMobileOpen = () => {
  return useSnapshot(menuState).menuMobileOpen
}
