import { proxy } from 'valtio'

type DialogSize = 'small' | 'tiny' | 'medium' | 'large' | 'xlarge' | 'xxlarge' | 'xxxlarge'

type IViewState = {
  initiated: boolean
  init: () => void
  open: boolean
  setOpen: (open: boolean) => void
  toggleOpen: () => void
  isNavigating: boolean
  setIsNavigating: (isNavigating: boolean) => void
  size: DialogSize
  setSize: (size: DialogSize) => void
}

const initViewState = () => {
  const state: IViewState = proxy({
    initiated: false,
    init: () => !state.initiated && (state.initiated = true),
    open: false,
    setOpen: (open) => {
      state.init()
      state.open = open
    },
    toggleOpen: () => {
      state.init()
      state.open = !state.open
    },
    isNavigating: false,
    setIsNavigating: (isNavigating) => (state.isNavigating = isNavigating),
    size: 'large',
    setSize: (size) => (state.size = size),
  })
  return state
}

export { initViewState }
export type { DialogSize, IViewState }
