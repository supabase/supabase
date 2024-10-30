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
