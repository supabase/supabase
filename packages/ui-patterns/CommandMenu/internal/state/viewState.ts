import type { TouchEventHandler } from 'react'

import { proxy } from 'valtio'

type DialogSize = 'small' | 'tiny' | 'medium' | 'large' | 'xlarge' | 'xxlarge' | 'xxxlarge'

interface ITouchHandlers {
  handleTouchStart: TouchEventHandler
  handleTouchMove: TouchEventHandler
  handleTouchEnd: TouchEventHandler
}

type IViewState = {
  initiated: boolean
  init: () => void
  open: boolean
  setOpen: (open: boolean) => void
  toggleOpen: () => void
  size: DialogSize
  setSize: (size: DialogSize) => void
  touchHandlers: ITouchHandlers
  setTouchHandlers: (handlers: ITouchHandlers) => void
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
    size: 'large',
    setSize: (size) => (state.size = size),
    touchHandlers: {
      handleTouchStart: () => {},
      handleTouchMove: () => {},
      handleTouchEnd: () => {},
    },
    setTouchHandlers: (handlers) => (state.touchHandlers = handlers),
  })
  return state
}

export { initViewState }
export type { DialogSize, IViewState, ITouchHandlers }
