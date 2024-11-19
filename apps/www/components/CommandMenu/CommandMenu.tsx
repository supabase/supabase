import { CommandHeader, CommandInput, CommandList, CommandMenu } from 'ui-patterns/CommandMenu'
import { useChangelogCommand } from 'ui-patterns/CommandMenu/prepackaged/Changelog'
import { useDocsAiCommands } from 'ui-patterns/CommandMenu/prepackaged/DocsAi'
import { useDocsSearchCommands } from 'ui-patterns/CommandMenu/prepackaged/DocsSearch'
import { useSupportCommands } from 'ui-patterns/CommandMenu/prepackaged/Support'
import { useThemeSwitcherCommands } from 'ui-patterns/CommandMenu/prepackaged/ThemeSwitcher'

export default function WwwCommandMenuEager() {
  useDocsSearchCommands()
  useDocsAiCommands()
  useChangelogCommand()
  useSupportCommands()
  useThemeSwitcherCommands()

  return (
    <CommandMenu>
      <CommandHeader>
        <CommandInput />
      </CommandHeader>
      <CommandList />
    </CommandMenu>
  )
}
