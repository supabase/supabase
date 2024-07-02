'use client'

import { useConstant } from 'common'
import { type PropsWithChildren, useEffect, useMemo, useCallback } from 'react'

import { useCrossCompatRouter } from './hooks/useCrossCompatRouter'
import { useSetCommandMenuOpen, useToggleCommandMenu } from './hooks/viewHooks'
import { CommandContext } from '../internal/Context'
import { initCommandsState } from '../internal/state/commandsState'
import { initPagesState } from '../internal/state/pagesState'
import { initViewState } from '../internal/state/viewState'
import { initQueryState } from '../internal/state/queryState'

const CommandProviderInternal = ({ children }: PropsWithChildren) => {
  const commandsState = useConstant(initCommandsState)
  const pagesState = useConstant(initPagesState)
  const queryState = useConstant(initQueryState)
  const viewState = useConstant(initViewState)

  const combinedState = useMemo(
    () => ({
      commandsState,
      pagesState,
      queryState,
      viewState,
    }),
    [] // values are constants so no dependencies to update
  )

  return <CommandContext.Provider value={combinedState}>{children}</CommandContext.Provider>
}

// This is a component not a hook so it can be used within the right context.
function CommandShortcut() {
  const toggleOpen = useToggleCommandMenu()

  useEffect(() => {
    const handleKeydown = (evt: KeyboardEvent) => {
      if (evt.key === 'k' && evt.metaKey) {
        evt.preventDefault()
        toggleOpen()
      }
    }

    document.addEventListener('keydown', handleKeydown)

    return () => document.removeEventListener('keydown', handleKeydown)
  }, [toggleOpen])

  return null
}

// This is a component not a hook so it can be used within the right context.
function CloseOnNavigation() {
  const setIsOpen = useSetCommandMenuOpen()
  const router = useCrossCompatRouter()

  const completeNavigation = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  useEffect(() => {
    router.events.onRouteChangeComplete(completeNavigation)
    return () => router.events.offRouteChangeComplete(completeNavigation)
  }, [router])

  return null
}

const CommandProvider = ({ children }: PropsWithChildren) => {
  return (
    <CommandProviderInternal>
      <CommandShortcut />
      <CloseOnNavigation />
      {children}
    </CommandProviderInternal>
  )
}

export { CommandProvider }
