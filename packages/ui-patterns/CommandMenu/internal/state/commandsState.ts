import { proxy } from 'valtio'

import { type ICommand } from '../Command'
import { type ICommandSectionName, type ICommandSection, section$new } from '../CommandSection'

type OrderSectionInstruction = (sections: Array<ICommandSection>, section: ICommandSection) => void
type OrderCommandsInstruction = (
  commands: Array<ICommand>,
  commandsToInsert: Array<ICommand>
) => void
type UseCommandOptions = {
  orderSection?: OrderSectionInstruction
  orderCommands?: OrderCommandsInstruction
}

type ICommandsState = {
  commandSections: Array<ICommandSection>
  registerNewSection: (
    sectionName: ICommandSectionName,
    commands: Array<ICommand>,
    options?: UseCommandOptions
  ) => () => void
}

const initCommandsState = () => {
  const state: ICommandsState = proxy({
    commandSections: [],
    registerNewSection: (sectionName, commands, options) => {
      let editIndex = state.commandSections.findIndex((section) => section.name === sectionName)
      if (editIndex === -1) editIndex = state.commandSections.length
      state.commandSections[editIndex] ??= section$new(sectionName)

      options?.orderSection?.(state.commandSections, state.commandSections[editIndex])

      if (options?.orderCommands) {
        options.orderCommands(state.commandSections[editIndex].commands, commands)
      } else {
        state.commandSections[editIndex].commands.push(...commands)
      }

      const closedOverCurrSection = state.commandSections[editIndex]
      return () => {
        const idx = state.commandSections.indexOf(closedOverCurrSection)
        if (idx) {
          const filteredCommands = state.commandSections[idx].commands.filter(
            (command) => !commands.includes(command)
          )
          if (!filteredCommands.length) {
            state.commandSections.splice(idx)
          } else {
            state.commandSections[idx].commands = filteredCommands
          }
        }
      }
    },
  })
  return state
}

export { initCommandsState }
export type { ICommandsState, UseCommandOptions }
