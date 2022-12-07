import { proxy, useSnapshot } from 'valtio'

export const menuState = proxy({
  // values
  menuActiveRefId: '',
  // set states
  setMenuActiveRefId: (value) => {
    menuState.menuActiveRefId = value
  },
})

export const useMenuActiveRefId = () => {
  return useSnapshot(menuState).menuActiveRefId
}
