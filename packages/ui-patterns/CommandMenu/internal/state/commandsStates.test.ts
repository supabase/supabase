import { section$new } from '../CommandSection'
import { type ICommandsState, orderSectionFirst, initCommandsState } from './commandsState'

describe('orderSectionFirst', () => {
  it('Orders newly created section first', () => {
    const first = section$new('First')
    const second = section$new('Second')
    const third = section$new('Third')
    const sections = [first, second, third]

    const expected = [third, first, second]
    const actual = orderSectionFirst(sections, 2)
    expect(actual).toEqual(expected)
  })

  it('Orders sole section first', () => {
    const only = section$new('Only')
    const sections = [only]

    const actual = orderSectionFirst(sections, 0)
    expect(actual).toEqual(sections)
  })

  it('Orders existing section first', () => {
    const first = section$new('First')
    const second = section$new('Second')
    const third = section$new('Third')
    const sections = [first, second, third]

    const expected = [second, first, third]
    const actual = orderSectionFirst(sections, 1)
    expect(actual).toEqual(expected)
  })
})

describe('commandState', () => {
  let commandsState: ICommandsState

  beforeEach(() => {
    commandsState = initCommandsState()
  })

  it('Registers commands in new section', () => {
    const sectionName = 'Section'
    const commands = [
      { id: 'first', name: 'First', action: () => {} },
      { id: 'second', name: 'Second', action: () => {} },
    ]

    const expected = [section$new(sectionName)]
    expected[0].commands = commands

    commandsState.registerSection(sectionName, commands)
    const actual = commandsState.commandSections

    expect(actual).toEqual(expected)
  })

  it('Registers command in pre-existing section', () => {
    const sectionA = 'A'
    const sectionB = 'B'

    const existingCommands = [
      { id: 'first', name: 'First', action: () => {} },
      { id: 'second', name: 'Second', action: () => {} },
    ]

    const commandsToAdd = [{ id: 'third', name: 'Third', action: () => {} }]

    const sections = [section$new(sectionA), section$new(sectionB)]
    sections[0].commands = existingCommands
    commandsState.commandSections = sections

    const expected = [section$new(sectionA), section$new(sectionB)]
    expected[0].commands = existingCommands
    expected[0].commands = expected[0].commands.concat(commandsToAdd)

    commandsState.registerSection('A', commandsToAdd)
    const actual = commandsState.commandSections
    expect(actual).toEqual(expected)
  })

  it('Reorders sections if orderSection is given', () => {
    const sectionA = 'A'
    const sectionB = 'B'

    const commands = [{ id: 'first', name: 'First', action: () => {} }]

    const sections = [section$new(sectionA), section$new(sectionB)]
    commandsState.commandSections = sections

    const expected = [section$new(sectionB), section$new(sectionA)]
    expected[0].commands = commands

    commandsState.registerSection('B', commands, { orderSection: orderSectionFirst })
    const actual = commandsState.commandSections
    expect(actual).toEqual(expected)
  })

  it('Reorders commands if orderCommands is given', () => {
    const sectionName = 'Section'

    const existingCommands = [
      { id: 'first', name: 'First', action: () => {} },
      { id: 'second', name: 'Second', action: () => {} },
    ]

    const sections = [section$new(sectionName)]
    sections[0].commands = existingCommands
    commandsState.commandSections = sections

    const commandsToAdd = [{ id: 'third', name: 'Third', action: () => {} }]

    const expected = [section$new(sectionName)]
    expected[0].commands = [existingCommands[0], commandsToAdd[0], existingCommands[1]]

    commandsState.registerSection('Section', commandsToAdd, {
      orderCommands: (oldCommands, newCommand) => {
        const commands = [...oldCommands]
        commands.splice(1, 0, ...commandsToAdd)
        return commands
      },
    })
    const actual = commandsState.commandSections

    expect(actual).toEqual(expected)
  })

  it('Unregisters commands when returned function is called', () => {})

  it('Unregisters entire section if no commands remain', () => {})
})
