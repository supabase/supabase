import { Button } from '@ui/components/shadcn/ui/button'
import { useMemo } from 'react'
import {
  CommandInput,
  CommandList,
  CommandMenu,
  CommandMenuTrigger as CommandMenuTriggerPrimitive,
  CommandProvider,
  PageType,
  useRegisterCommands,
  useRegisterPage,
  useSetPage,
} from 'ui-patterns/CommandMenu'

function Commands() {
  const setPage = useSetPage()

  const commands = useMemo(
    () => [
      {
        id: 'subcommand',
        name: 'Subcommand',
        action: () => alert('Triggered from subpage'),
      },
    ],
    []
  )

  useRegisterPage(
    'Subpage',
    {
      type: PageType.Commands,
      sections: [
        {
          id: 'subpage',
          name: 'Subpage',
          commands,
        },
      ],
    },
    { deps: [commands] }
  )

  useRegisterCommands('Commands', [
    {
      id: 'subpage',
      name: 'Go to subpage',
      action: () => setPage('Subpage'),
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
