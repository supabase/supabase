import { proxy } from 'valtio'
import { type ICommand } from '../Command'
import { type ICommandSection, section$new } from '../CommandSection'

type OrderSectionInstruction = (sections: ICommandSection[], idx: number) => ICommandSection[]
type OrderCommandsInstruction = (
  commands: ICommand[],
  commandsToInsert: ICommand[]
) => Array<ICommand>
type CommandOptions = {
  deps?: any[]
  enabled?: boolean
  forceMountSection?: boolean
  orderSection?: OrderSectionInstruction
  orderCommands?: OrderCommandsInstruction
}

type ICommandsState = {
  commandSections: ICommandSection[]
  registerSection: (
    sectionName: string,
    commands: ICommand[],
    options?: CommandOptions
  ) => () => void
}

const initCommandsState = () => {
  const state: ICommandsState = proxy({
    commandSections: [],
    registerSection: (sectionName, commands, options) => {
      let editIndex = state.commandSections.findIndex((section) => section.name === sectionName)
      if (editIndex === -1) editIndex = state.commandSections.length

      state.commandSections[editIndex] ??= section$new(sectionName)

      if (options?.forceMountSection) state.commandSections[editIndex].forceMount = true

      if (options?.orderCommands) {
        state.commandSections[editIndex].commands = options.orderCommands(
          state.commandSections[editIndex].commands,
          commands
        )
      } else {
        state.commandSections[editIndex].commands.push(...commands)
      }

      state.commandSections =
        options?.orderSection?.(state.commandSections, editIndex) ?? state.commandSections

      return () => {
        const idx = state.commandSections.findIndex((section) => section.name === sectionName)
        if (idx !== -1) {
          const filteredCommands = state.commandSections[idx].commands.filter(
            (command) => !commands.map((cmd) => cmd.id).includes(command.id)
          )
          if (!filteredCommands.length) {
            state.commandSections.splice(idx, 1)
          } else {
            state.commandSections[idx].commands = filteredCommands
          }
        }
      }
    },
  })

  return state
}

const orderSectionFirst = (sections: ICommandSection[], idx: number) => [
  sections[idx],
  ...sections.slice(0, idx),
  ...sections.slice(idx + 1),
]

export { initCommandsState, orderSectionFirst }
export type { ICommandsState, CommandOptions }
