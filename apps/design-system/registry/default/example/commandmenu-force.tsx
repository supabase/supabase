import { Button } from '@ui/components/shadcn/ui/button'
import {
  CommandInput,
  CommandList,
  CommandMenu,
  CommandProvider,
  useRegisterCommands,
  useSetCommandMenuOpen,
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
  const setOpen = useSetCommandMenuOpen()

  return <Button onClick={() => setOpen(true)}>Open command menu</Button>
}

export default function CommandMenuDemo() {
  return (
    <CommandProvider openKey="">
      <CommandMenuTrigger />
      <Commands />
      <CommandMenu>
        <CommandInput />
        <CommandList />
      </CommandMenu>
    </CommandProvider>
  )
}
