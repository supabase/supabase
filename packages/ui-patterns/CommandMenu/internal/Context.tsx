import { createContext, useContext } from 'react'

import { type ICommandsState } from '../internal/state/commandsState'
import { type IPagesState } from '../internal/state/pagesState'
import { type IQueryState } from '../internal/state/queryState'
import { type IViewState } from '../internal/state/viewState'

const CommandContext = createContext<
  | {
      commandsState: ICommandsState
      pagesState: IPagesState
      queryState: IQueryState
      viewState: IViewState
    }
  | undefined
>(undefined)

const useCommandContext = () => {
  const ctx = useContext(CommandContext)
  if (!ctx) throw Error('`useCommandContext` must be used within a `CommandProvider`')
  return ctx
}

export { CommandContext, useCommandContext }
