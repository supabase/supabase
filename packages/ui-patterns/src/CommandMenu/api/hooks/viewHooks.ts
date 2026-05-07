'use client'

import { useCallback, useLayoutEffect, useRef } from 'react'
import { useSnapshot } from 'valtio'

import { useCommandContext } from '../../internal/Context'
import { type DialogSize, type ITouchHandlers } from '../../internal/state/viewState.types'

const useCommandMenuInitiated = () => {
  const { viewState } = useCommandContext()
  const { initiated } = useSnapshot(viewState)
  return initiated
}

const useCommandMenuOpen = () => {
  const { viewState } = useCommandContext()
  const { open } = useSnapshot(viewState)
  return open
}

const useSetCommandMenuOpen = () => {
  const { viewState } = useCommandContext()
  const { setOpen } = useSnapshot(viewState)
  return setOpen
}

const useResetCommandMenu = () => {
  const { queryState, pagesState } = useCommandContext()
  return useCallback(() => {
    queryState.setQuery('')
    pagesState.pageStack.length = 0
  }, [queryState, pagesState])
}

const useToggleCommandMenu = () => {
  const { viewState } = useCommandContext()
  const { toggleOpen } = useSnapshot(viewState)
  return toggleOpen
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

const useSetupCommandMenuTouchEvents = () => {
  const { viewState } = useCommandContext()
  const { setTouchHandlers } = useSnapshot(viewState)

  return setTouchHandlers
}

const useCommandMenuTouchGestures = () => {
  const { viewState } = useCommandContext()
  const { touchHandlers } = useSnapshot(viewState)

  return touchHandlers
}

export {
  useCommandMenuInitiated,
  useCommandMenuOpen,
  useResetCommandMenu,
  useSetCommandMenuOpen,
  useToggleCommandMenu,
  useCommandMenuSize,
  useSetCommandMenuSize,
  useSetupCommandMenuTouchEvents,
  useCommandMenuTouchGestures,
}
