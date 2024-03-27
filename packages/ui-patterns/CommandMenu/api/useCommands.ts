import { type ICommand } from '../internal/Command'
import {
  section$new,
  type ICommandSection,
  type ICommandSectionName,
} from '../internal/CommandSection'
import { useCommandSectionsContext } from '../internal/Context'

type OrderSectionInstruction = (
  sections: Array<ICommandSection>,
  sectionToInsert: ICommandSection
) => Array<ICommandSection>
type OrderCommandsInstruction = (
  commands: Array<ICommand>,
  commandsToInsert: Array<ICommand>
) => Array<ICommand>
type UseCommandOptions = {
  orderSection: OrderSectionInstruction
  orderCommands: OrderCommandsInstruction
}

const useCommands = (
  commands: Array<ICommand>,
  sectionName: ICommandSectionName,
  options?: UseCommandOptions
) => {
  const { commandSections: currCommandSections, setCommandSections } = useCommandSectionsContext()

  const existingSectionIndex = currCommandSections.findIndex(
    (section) => section.name === sectionName
  )
  const newSection = appendCommands(
    existingSectionIndex !== -1
      ? currCommandSections[existingSectionIndex]
      : section$new(sectionName),
    commands,
    options?.orderCommands
  )

  if (!options?.orderSection) {
    const insertionIndex =
      existingSectionIndex !== -1 ? existingSectionIndex : currCommandSections.length
    return setCommandSections([
      ...currCommandSections.slice(0, insertionIndex),
      newSection,
      ...currCommandSections.slice(insertionIndex),
    ])
  } else {
    return setCommandSections(options.orderSection(currCommandSections, newSection))
  }
}

const appendCommands = (
  section: ICommandSection,
  commands: Array<ICommand>,
  order?: OrderCommandsInstruction
): ICommandSection => {
  return order
    ? { id: section.id, name: section.name, commands: order(section.commands, commands) }
    : { id: section.id, name: section.name, commands: [...section.commands, ...commands] }
}

export { useCommands }
