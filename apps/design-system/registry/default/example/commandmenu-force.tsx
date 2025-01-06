import { Button } from '@ui/components/shadcn/ui/button'
import {
  CommandInput,
  CommandList,
  CommandMenu,
  CommandMenuTrigger as CommandMenuTriggerPrimitive,
  CommandProvider,
  useRegisterCommands,
} from 'ui-patterns/CommandMenu'

function Commands() {
  useRegisterCommands('Commands', [
    {
      id: 'forced',
      name: 'Force-mounted',
      action: () => alert("This command always shows even if it doesn't match the search query"),
      forceMount: true,
    },
    {
      id: 'not-forced',
      name: 'Not force-mounted',
      action: () => alert("This command will disappear if it doesn't match the search query"),
    },
  ])
  useRegisterCommands(
    'Force-mounted section',
    [
      {
        id: 'example',
        name: 'An example',
        action: () => alert('This entire section is force-mounted'),
      },
    ],
    {
      forceMountSection: true,
    }
  )

  return null
}

function CommandMenuTrigger() {
  return (
    <CommandMenuTriggerPrimitive>
      <Button>Open command menu</Button>
    </CommandMenuTriggerPrimitive>
  )
}

export default function CommandMenuDemo() {
  return (
    <CommandProvider openKey="">
      <Commands />
      <CommandMenu trigger={<CommandMenuTrigger />}>
        <CommandInput />
        <CommandList />
      </CommandMenu>
    </CommandProvider>
  )
}
