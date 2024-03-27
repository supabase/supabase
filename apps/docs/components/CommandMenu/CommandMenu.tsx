import { CommandInput, CommandList, CommandMenu } from 'ui-patterns/CommandMenu'
import { useDocsSearchCommands } from 'ui-patterns/CommandMenu/prepackaged/DocsSearch'

const DocsCommandMenu = ({ open }: { open: boolean }) => {
  useDocsSearchCommands()

  return (
    <CommandMenu open={open}>
      <CommandInput />
      <CommandList />
    </CommandMenu>
  )
}

export { DocsCommandMenu as default }
