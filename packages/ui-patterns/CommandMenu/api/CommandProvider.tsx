import { type PropsWithChildren, useEffect, useMemo } from 'react'

import { useConstant } from 'common'

import { useToggleCommandMenu } from './hooks/viewHooks'
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

const CommandShortcut = () => {
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

const CommandProvider = ({ children }: PropsWithChildren) => (
  <CommandProviderInternal>
    <CommandShortcut />
    {children}
  </CommandProviderInternal>
)

export { CommandProvider }
