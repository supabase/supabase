import { proxy } from 'valtio'

import { section$new } from '../CommandSection'
import { type CommandOptions, type ICommandSection, type ICommandsState } from '../types'

const initCommandsState = () => {
  const state: ICommandsState = proxy({
    commandSections: [],
    registerSection: (sectionName, commands, options) => {
      let editIndex = state.commandSections.findIndex((section) => section.name === sectionName)
      if (editIndex === -1) editIndex = state.commandSections.length

      state.commandSections[editIndex] ??= section$new(sectionName)
      if (options?.sectionMeta) {
        const oldMeta = state.commandSections[editIndex].meta
        if (!!oldMeta && typeof oldMeta === 'object' && typeof options.sectionMeta === 'object') {
          state.commandSections[editIndex].meta = { ...oldMeta, ...options.sectionMeta }
        } else {
          state.commandSections[editIndex].meta = options.sectionMeta
        }
      }

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
export type { CommandOptions }
