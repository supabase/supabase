import { proxy } from 'valtio'
import type { IViewState } from './viewState.types'

const initViewState = () => {
  const state: IViewState = proxy({
    initiated: false,
    init: () => {
      if (!state.initiated) {
        state.initiated = true
        return true
      }
      return false
    },
    open: false,
    size: 'large',
    triggerSource: 'other',
    touchHandlers: {
      handleTouchStart: () => {},
      handleTouchMove: () => {},
      handleTouchEnd: () => {},
    },
    setOpen: (open, source = 'other') => {
      state.init()
      state.open = open
      state.triggerSource = source
    },
    toggleOpen: (source = 'other') => {
      state.init()
      state.open = !state.open
      state.triggerSource = source
    },
    setSize: (size) => {
      state.size = size
    },
    setTouchHandlers: (handlers) => {
      state.touchHandlers = handlers
    },
    setTriggerSource: (source) => {
      state.triggerSource = source
    },
  })

  return state
}

export { initViewState }
export type { DialogSize, ITouchHandlers } from './viewState.types'
