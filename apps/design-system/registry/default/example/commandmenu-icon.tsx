import { Button } from '@ui/components/shadcn/ui/button'
import { Github } from 'lucide-react'
import {
  CommandMenu,
  CommandMenuInput,
  CommandMenuList,
  CommandMenuTrigger as CommandMenuTriggerPrimitive,
  CommandProvider,
  useRegisterCommands,
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
        <CommandMenuInput />
        <CommandMenuList />
      </CommandMenu>
    </CommandProvider>
  )
}
