import { CommandInput, CommandList, CommandMenu } from 'ui-patterns/CommandMenu'
import { useChangelogCommand } from 'ui-patterns/CommandMenu/prepackaged/Changelog'
import { useDocsAiCommands } from 'ui-patterns/CommandMenu/prepackaged/DocsAi'
import { useDocsSearchCommands } from 'ui-patterns/CommandMenu/prepackaged/DocsSearch'
import { useSupportCommands } from 'ui-patterns/CommandMenu/prepackaged/Support'
import { useThemeSwitcherCommands } from 'ui-patterns/CommandMenu/prepackaged/ThemeSwitcher'

const WwwCommandMenu = () => {
  useDocsSearchCommands()
  useDocsAiCommands()
  useSupportCommands()
  useChangelogCommand()
  useThemeSwitcherCommands()

  return (
    <CommandMenu>
      <CommandInput />
      <CommandList />
    </CommandMenu>
  )
}

export { WwwCommandMenu as default }
