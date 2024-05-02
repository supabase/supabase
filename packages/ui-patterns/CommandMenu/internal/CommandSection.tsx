import { type ICommand } from './Command'

type ICommandSectionName = string

type ICommandSection = {
  id: string
  name: ICommandSectionName
  forceMount?: boolean
  commands: Array<ICommand>
}

const toSectionId_ = (str: string) => str.toLowerCase().replace(/\s+/g, '-')

const section$new = (
  name: ICommandSectionName,
  { forceMount = false, id }: { forceMount?: boolean; id?: string } = {}
): ICommandSection => ({
  id: id ?? toSectionId_(name),
  name,
  forceMount,
  commands: [],
})

export { section$new, toSectionId_ }
export type { ICommandSection, ICommandSectionName }
