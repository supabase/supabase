import { Button } from 'ui'
import { useMemo } from 'react'
import {
  CommandInput,
  CommandList,
  CommandMenu,
  CommandProvider,
  PageType,
  useRegisterCommands,
  useRegisterPage,
  useSetCommandMenuOpen,
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
