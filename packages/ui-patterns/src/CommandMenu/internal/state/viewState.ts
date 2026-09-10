import { proxy } from 'valtio'

import { type DialogSize, type ITouchHandlers, type IViewState } from './viewState.types'

const initViewState = () => {
  const state: IViewState = proxy({
    initiated: false,
    init: () => !state.initiated && (state.initiated = true),
    open: false,
    size: 'large',
    touchHandlers: {
      handleTouchStart: () => {},
      handleTouchMove: () => {},
      handleTouchEnd: () => {},
    },
    setOpen: (open) => {
      state.init()
      state.open = open
    },
    toggleOpen: () => {
      state.init()
      state.open = !state.open
    },
    setSize: (size) => {
      state.size = size
    },
    setTouchHandlers: (handlers) => {
      state.touchHandlers = handlers
    },
  })

  return state
}

export { initViewState }
export type { DialogSize, ITouchHandlers }
