import { proxy } from 'valtio'

import { type ICommand } from '../Command'
import { type ICommandSectionName, type ICommandSection, section$new } from '../CommandSection'

type OrderSectionInstruction = (sections: ICommandSection[], idx: number) => ICommandSection[]
type OrderCommandsInstruction = (
  commands: ICommand[],
  commandsToInsert: ICommand[]
) => Array<ICommand>
type UseCommandOptions = {
  deps?: any[]
  enabled?: boolean
  forceMountSection?: boolean
  orderSection?: OrderSectionInstruction
  orderCommands?: OrderCommandsInstruction
}

type ICommandsState = {
  commandSections: ICommandSection[]
  registerSection: (
    sectionName: ICommandSectionName,
    commands: ICommand[],
    options?: UseCommandOptions
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

/**
 * [Charis] This may be a premature optimization, but since this runs so many
 * times, I'm doing this imperatively to cut down on array initialization.
 * Haven't actually measured, YOLO.
 */
const orderSectionFirst = (sections: ICommandSection[], idx: number) => {
  const result = Array.from({ length: sections.length }) satisfies ICommandSection[]

  result[0] = sections[idx]

  let j = 1
  for (let i = 0; i < idx; i++) {
    result[j++] = sections[i]
  }
  for (let i = idx + 1; i < sections.length; i++) {
    result[j++] = sections[i]
  }

  return result
}

export { initCommandsState, orderSectionFirst }
export type { ICommandsState, UseCommandOptions }
