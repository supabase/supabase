import { proxy } from 'valtio'

const commandMenuView = proxy({
  init: false,
  open: false,
  runInit: () => !commandMenuView.init && (commandMenuView.init = true),
  setOpen: (open: boolean) => {
    commandMenuView.runInit()
    commandMenuView.open = open
  },
  toggleOpen: () => {
    commandMenuView.runInit()
    commandMenuView.open = !commandMenuView.open
  },
})

export { commandMenuView }
