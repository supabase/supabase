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
  useRegisterCommands('Action commands', [
    {
      id: 'alert',
      name: 'Alert',
      action: () => alert('You triggered a command'),
    },
  ])
  useRegisterCommands('Route commands', [
    {
      id: 'supabase-website',
      name: 'Go to Supabase website',
      route: 'https://supabase.com',
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
    <CommandProvider openKey="j">
      <CommandMenuTrigger />
      <Commands />
      <CommandMenu>
        <CommandInput />
        <CommandList />
      </CommandMenu>
    </CommandProvider>
  )
}
