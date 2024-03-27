import { type ICommand } from '../internal/Command'
import { type IBaseCommandSection } from '../internal/CommandSection'
import { useCommandContext } from '../internal/Context'

type UseCommandOptions<ICommandSection> = {
  orderSection: (
    sections: Array<ICommandSection>,
    sectionToInsert: ICommandSection
  ) => Array<ICommandSection>
  orderCommands: (commands: Array<ICommand>, commandsToInsert: Array<ICommand>) => Array<ICommand>
}

const useCommands = <ICommandSection extends IBaseCommandSection = IBaseCommandSection>(
  commands: Array<ICommand>,
  section: ICommandSection,
  options?: UseCommandOptions<ICommandSection>
) => {
  const { commands: currCommands, setCommands } = useCommandContext()
}

export { useCommands }
