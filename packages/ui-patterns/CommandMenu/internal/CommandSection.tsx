import { type ICommand } from './Command'

type ICommandSectionName = string

type ICommandSection = {
  id: string
  name: ICommandSectionName
  commands: Array<ICommand>
}

const toSectionId = (str: string) => str.toLowerCase().replace(/\s+/g, '-')

const section$new = (name: ICommandSectionName, id?: string): ICommandSection => ({
  id: id ?? toSectionId(name),
  name,
  commands: [],
})

export { section$new, toSectionId }
export type { ICommandSection, ICommandSectionName }
