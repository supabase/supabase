import { useLayoutEffect, useRef } from 'react'
import { useSnapshot } from 'valtio'

import { useCommandContext } from '../../internal/Context'
import { type DialogSize } from '../../internal/state/viewState'

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

const useIsCommandNavigating = () => {
  const { viewState } = useCommandContext()
  const { isNavigating } = useSnapshot(viewState)
  return isNavigating
}

const useSetIsCommandNavigating = () => {
  const { viewState } = useCommandContext()
  const { setIsNavigating } = useSnapshot(viewState)
  return setIsNavigating
}

const useCommandMenuSize = () => {
  const { viewState } = useCommandContext()
  const { size } = useSnapshot(viewState)
  return size
}

const useSetCommandMenuSize = (newSize: DialogSize) => {
  const { viewState } = useCommandContext()
  const { setSize, size } = useSnapshot(viewState)

  const originalSize = useRef(size)

  useLayoutEffect(() => {
    setSize(newSize)
    return () => setSize(originalSize.current)
  }, [setSize])
}

export {
  useCommandMenuInitiated,
  useCommandMenuVisible,
  useSetCommandMenuOpen,
  useToggleCommandMenu,
  useIsCommandNavigating,
  useSetIsCommandNavigating,
  useCommandMenuSize,
  useSetCommandMenuSize,
}
