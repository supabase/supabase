import { isEqual } from 'lodash'
import { useEffect, useReducer, useRef } from 'react'
import { useSnapshot } from 'valtio'

import type { ICommand, ICommandSectionName, UseCommandOptions } from '../types'
import { useCommandContext } from '../../internal/Context'
import { useCurrentPage } from './pagesHooks'
import { PageDefinition, isCommandsPage } from '../../internal/state/pagesState'

const useCommands = () => {
  const { commandsState } = useCommandContext()
  const { commandSections } = useSnapshot(commandsState)

  const _currPage = useCurrentPage()
  const currPage = _currPage as PageDefinition
  if (currPage && isCommandsPage(currPage)) return currPage.commands

  return commandSections
}

const useRegisterCommands = (
  sectionName: ICommandSectionName,
  commands: ICommand[],
  options?: UseCommandOptions
) => {
  const { commandsState } = useCommandContext()
  const { registerSection } = useSnapshot(commandsState)

  const [rerenderFlag, toggleRerenderFlag] = useReducer((flag) => (flag === 0 ? 1 : 0), 0)
  const prevDeps = useRef(options?.deps)

  if (!isEqual(prevDeps.current, options?.deps)) {
    prevDeps.current = options?.deps
    toggleRerenderFlag()
  }

  useEffect(() => registerSection(sectionName, commands, options), [registerSection, rerenderFlag])
}

export { useCommands, useRegisterCommands }
