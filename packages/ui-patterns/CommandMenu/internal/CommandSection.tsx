import { type ICommand } from './Command'

type ICommandSection = {
  id: string
  name: string
  forceMount: boolean
  commands: Array<ICommand>
}

const toSectionId = (str: string) => str.toLowerCase().replace(/\s+/g, '-')

const section$new = (
  name: string,
  { forceMount = false, id }: { forceMount?: boolean; id?: string } = {}
): ICommandSection => ({
  id: id ?? toSectionId(name),
  name,
  forceMount,
  commands: [],
})

export { section$new }
export type { ICommandSection }
