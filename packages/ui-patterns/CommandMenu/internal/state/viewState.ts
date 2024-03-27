import { proxy } from 'valtio'

type IViewState = {
  initiated: boolean
  init: () => void
  open: boolean
  setOpen: (open: boolean) => void
  toggleOpen: () => void
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
  })
  return state
}

export { initViewState }
export type { IViewState }
