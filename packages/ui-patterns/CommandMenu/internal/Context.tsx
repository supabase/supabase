import { type Dispatch, type SetStateAction, createContext, useContext } from 'react'

import { type ICommand } from './Command'

type InternalContext = {
  commands: Array<ICommand>
  setCommands: Dispatch<SetStateAction<Array<ICommand>>>
}

const CommandContext = createContext<InternalContext | undefined>(undefined)

const useCommandContext = () => {
  const ctx = useContext(CommandContext)
  if (!ctx) throw Error('`useCommandContext` must be used within a matching provider')
  return ctx
}

export { CommandContext, useCommandContext }
