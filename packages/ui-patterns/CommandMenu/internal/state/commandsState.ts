import { proxy } from 'valtio'

import { type ICommand } from '../Command'
import { type ICommandSectionName, type ICommandSection, section$new } from '../CommandSection'

type OrderSectionInstruction = (
  sections: Array<ICommandSection>,
  idx: number
) => Array<ICommandSection>
type OrderCommandsInstruction = (
  commands: Array<ICommand>,
  commandsToInsert: Array<ICommand>
) => Array<ICommand>
type UseCommandOptions = {
  forceMountSection?: boolean
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

      if (options?.forceMountSection) state.commandSections[editIndex].forceMount = true

      state.commandSections =
        options?.orderSection?.(state.commandSections, editIndex) ?? state.commandSections

      if (options?.orderCommands) {
        state.commandSections[editIndex].commands = options.orderCommands(
          state.commandSections[editIndex].commands,
          commands
        )
      } else {
        state.commandSections[editIndex].commands.push(...commands)
      }

      return () => {
        const idx = state.commandSections.findIndex((section) => section.name === sectionName)
        console.log(state.commandSections, idx)
        if (idx !== -1) {
          const filteredCommands = state.commandSections[idx].commands.filter(
            (command) => !commands.map((cmd) => cmd.id).includes(command.id)
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
