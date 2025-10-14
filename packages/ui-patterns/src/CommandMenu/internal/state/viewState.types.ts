export type DialogSize = 'small' | 'tiny' | 'medium' | 'large' | 'xlarge' | 'xxlarge' | 'xxxlarge'

export type CommandMenuTriggerSource = 'keyboard' | 'quick-actions' | 'other'

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
  triggerSource: CommandMenuTriggerSource
  touchHandlers: ITouchHandlers
  setOpen: (open: boolean, source?: CommandMenuTriggerSource) => void
  toggleOpen: (source?: CommandMenuTriggerSource) => void
  setSize: (size: DialogSize) => void
  setTouchHandlers: (handlers: ITouchHandlers) => void
  setTriggerSource: (source: CommandMenuTriggerSource) => void
}
