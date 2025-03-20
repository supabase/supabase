export type DialogSize = 'small' | 'tiny' | 'medium' | 'large' | 'xlarge' | 'xxlarge' | 'xxxlarge'

export type ITouchHandlers = {
  handleTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void
  handleTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void
  handleTouchEnd: (e: React.TouchEvent<HTMLDivElement>) => void
}

export interface IViewState {
  initiated: boolean
  init: () => boolean
  open: boolean
  size: DialogSize
  touchHandlers: ITouchHandlers
  setOpen: (open: boolean) => void
  toggleOpen: () => void
  setSize: (size: DialogSize) => void
  setTouchHandlers: (handlers: ITouchHandlers) => void
}
