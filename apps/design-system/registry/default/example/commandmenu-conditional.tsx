import { Button } from 'ui'
import { useMemo, useState } from 'react'
import {
  CommandInput,
  CommandList,
  CommandMenu,
  CommandProvider,
  useRegisterCommands,
  useSetCommandMenuOpen,
} from 'ui-patterns/CommandMenu'

function Commands() {
  const [activeCommand, setActiveCommand] = useState(1)

  const toggleCommands = () => setActiveCommand((state) => (state === 1 ? 2 : 1))

  const commandOne = useMemo(
    () => [
      {
        id: 'one',
        name: 'One',
        action: () => alert('One'),
      },
    ],
    []
  )

  const commandTwo = useMemo(
    () => [
      {
        id: 'two',
        name: 'Two',
        action: () => alert('Two'),
      },
    ],
    []
  )

  const command = activeCommand === 1 ? commandOne : commandTwo

  useRegisterCommands('Commands', command, { deps: [command] })

  return (
    <Button onClick={toggleCommands} type="default">
      {activeCommand === 1 ? 'Change command to command two' : 'Change command to command one'}
    </Button>
  )
}

function CommandMenuTrigger() {
  const setOpen = useSetCommandMenuOpen()

  return <Button onClick={() => setOpen(true)}>Open command menu</Button>
}

export default function CommandMenuDemo() {
  return (
    <CommandProvider openKey="j">
      <div className="flex flex-col gap-2">
        <CommandMenuTrigger />
        <Commands />
      </div>
      <CommandMenu>
        <CommandInput />
        <CommandList />
      </CommandMenu>
    </CommandProvider>
  )
}
