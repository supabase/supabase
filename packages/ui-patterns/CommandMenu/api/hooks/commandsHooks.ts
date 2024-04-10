import { useEffect, useReducer, useRef } from 'react'
import { useSnapshot } from 'valtio'
import { useCommandContext } from '../../internal/Context'
import type { ICommand, ICommandSectionName, UseCommandOptions } from '../types'
import { isEqual } from 'lodash'

const useCommands = () => {
  const { commandsState } = useCommandContext()
  const { commandSections } = useSnapshot(commandsState)
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
