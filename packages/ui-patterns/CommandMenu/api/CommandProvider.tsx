import { useConstant } from 'common'
import { useEffect, type PropsWithChildren } from 'react'

import { useToggleCommandMenu } from './hooks/viewHooks'
import { CommandContext } from '../internal/Context'
import { initCommandsState } from '../internal/state/commandsState'
import { initPagesState } from '../internal/state/pagesState'
import { initQueryState } from '../internal/state/queryState'
import { initViewState } from '../internal/state/viewState'

const CommandProviderInternal = ({ children }: PropsWithChildren) => {
  const combinedState = useConstant(() => ({
    commandsState: initCommandsState(),
    pagesState: initPagesState(),
    queryState: initQueryState(),
    viewState: initViewState(),
  }))

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
