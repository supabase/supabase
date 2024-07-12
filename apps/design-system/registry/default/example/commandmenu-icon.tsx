import { Button } from 'ui'
import { Github } from 'lucide-react'
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
      id: 'github',
      name: 'Go to repo',
      route: 'https://github.com/supabase/supabase',
      icon: () => <Github />,
    },
  ])

  return null
}

function CommandMenuTrigger() {
  const setOpen = useSetCommandMenuOpen()

  return (
    <Button onClick={() => setOpen(true)} type="default">
      Open command menu
    </Button>
  )
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
