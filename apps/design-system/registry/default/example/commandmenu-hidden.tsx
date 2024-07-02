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
      id: 'shown',
      name: 'shown',
      action: () => alert('This command is shown by default'),
    },
    {
      id: 'hidden',
      name: 'open sesame',
      action: () => alert('This command is only shown when searched'),
      defaultHidden: true,
    },
  ])

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
