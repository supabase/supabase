import { useSnapshot } from 'valtio'

import { useCommandContext } from '../../internal/Context'

const useCommandMenuInitiated = () => {
  const { viewState } = useCommandContext()
  const { initiated } = useSnapshot(viewState)
  return initiated
}

const useCommandMenuVisible = () => {
  const { viewState } = useCommandContext()
  const { open } = useSnapshot(viewState)
  return open
}

const useSetCommandMenuOpen = () => {
  const { viewState } = useCommandContext()
  const { setOpen } = useSnapshot(viewState)
  return setOpen
}

const useToggleCommandMenu = () => {
  const { viewState } = useCommandContext()
  const { toggleOpen } = useSnapshot(viewState)
  return toggleOpen
}

export {
  useCommandMenuInitiated,
  useCommandMenuVisible,
  useSetCommandMenuOpen,
  useToggleCommandMenu,
}
