import { proxy, useSnapshot } from 'valtio'

export const menuState = proxy({
  // values
  menuActiveRefId: '',
  // set states
  setMenuActiveRefId: (value) => {
    menuState.menuActiveRefId = value
  },
  menuLevelId: '',
  setMenuLevelId: (value) => {
    menuState.menuLevelId = value
  },
})

export const useMenuActiveRefId = () => {
  return useSnapshot(menuState).menuActiveRefId
}
export const useMenuLevelId = () => {
  return useSnapshot(menuState).menuLevelId
}
