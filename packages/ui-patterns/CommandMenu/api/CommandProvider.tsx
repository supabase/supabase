import { type PropsWithChildren, useEffect, useMemo } from 'react'

import { useConstant } from 'common'

import {
  useIsCommandNavigating,
  useSetCommandMenuOpen,
  useSetIsCommandNavigating,
  useToggleCommandMenu,
} from './hooks/viewHooks'
import { CommandContext } from '../internal/Context'
import { initCommandsState } from '../internal/state/commandsState'
import { initPagesState } from '../internal/state/pagesState'
import { initViewState } from '../internal/state/viewState'
import { initQueryState } from '../internal/state/queryState'
import { useRouter } from 'next/router'

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

const CommandShortcut = () => {
  const toggleOpen = useToggleCommandMenu()
  const setIsOpen = useSetCommandMenuOpen()
  const setIsNavigating = useSetIsCommandNavigating()
  const isNavigating = useIsCommandNavigating()
  const router = useRouter()

  useEffect(() => {
    router.events.on('routeChangeComplete', () => {
      if (isNavigating) {
        setIsNavigating(false)
        setIsOpen(false)
      }
    })
  }, [router])

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

const CommandProvider = ({ children }: PropsWithChildren) => (
  <CommandProviderInternal>
    <CommandShortcut />
    {children}
  </CommandProviderInternal>
)

export { CommandProvider }
