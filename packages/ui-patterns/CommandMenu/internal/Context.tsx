import {
  type ReactNode,
  type Dispatch,
  type SetStateAction,
  createContext,
  useContext,
} from 'react'

import { type ICommandSection } from './CommandSection'

type InternalCommandsContext = {
  commandSections: Array<ICommandSection>
  setCommandSections: Dispatch<SetStateAction<Array<ICommandSection>>>
}

const CommandSectionsContext = createContext<InternalCommandsContext | undefined>(undefined)

const useCommandSectionsContext = () => {
  const ctx = useContext(CommandSectionsContext)
  if (!ctx) throw Error('`useCommandSectionsContext` must be used within a matching provider')
  return ctx
}

type ICommandPageName = string

type InternalPagesContext = {
  commandPages: Record<ICommandPageName, () => ReactNode>
  addCommandPage: (name: ICommandPageName, component: () => ReactNode) => () => void
  pageStack: Array<ICommandPageName>
  appendPageStack: (page: ICommandPageName) => void
  popPageStack: () => void
}

const CommandPagesContext = createContext<InternalPagesContext | undefined>(undefined)

const useCommandPagesContext = () => {
  const ctx = useContext(CommandPagesContext)
  if (!ctx) throw Error('`useCommandPagesContext` must be used within a matching provider')
  return ctx
}

export {
  CommandPagesContext,
  CommandSectionsContext,
  useCommandPagesContext,
  useCommandSectionsContext,
}
export type { ICommandPageName }
