import { useSnapshot } from 'valtio'

import type { ICommand, ICommandSectionName, UseCommandOptions } from '../types'
import { useCommandContext } from '../../internal/Context'
import { useEffect } from 'react'

const useCommands = () => {
  const { commandsState } = useCommandContext()
  const { commandSections } = useSnapshot(commandsState)
  return commandSections
}

const useRegisterCommands = (
  sectionName: ICommandSectionName,
  commands: Array<ICommand>,
  options?: UseCommandOptions
) => {
  const { commandsState } = useCommandContext()
  const { registerNewSection } = useSnapshot(commandsState)

  useEffect(() => registerNewSection(sectionName, commands, options), [registerNewSection])
}

export { useCommands, useRegisterCommands }
