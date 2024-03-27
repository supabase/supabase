import { type PropsWithChildren, useMemo } from 'react'

import { useConstant } from 'common'

import { CommandContext } from '../internal/Context'
import { initCommandsState } from '../internal/state/commandsState'
import { initPagesState } from '../internal/state/pagesState'
import { initViewState } from '../internal/state/viewState'
import { initQueryState } from '../internal/state/queryState'

const CommandProvider = ({ children }: PropsWithChildren) => {
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

export { CommandProvider }
