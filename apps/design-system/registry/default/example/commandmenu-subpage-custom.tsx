import { Button } from 'ui'
import { useMemo } from 'react'
import {
  Breadcrumb,
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

function CustomSubpage() {
  return (
    <div className="p-5">
      <Breadcrumb className="mb-4" />
      <h1 className="font-heading text-xl mb-4 text-foreground">Custom subpage</h1>
      <p className="text-foreground-light text-sm">
        Here is a custom subpage built from a component that you provide.
      </p>
    </div>
  )
}

function Commands() {
  const setPage = useSetPage()

  useRegisterPage('Subpage', {
    type: PageType.Component,
    component: CustomSubpage,
  })

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
