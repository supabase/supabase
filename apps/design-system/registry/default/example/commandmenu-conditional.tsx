import { Button } from '@ui/components/shadcn/ui/button'
import { useMemo, useState } from 'react'
import {
  CommandInput,
  CommandList,
  CommandMenu,
  CommandMenuTrigger as CommandMenuTriggerPrimitive,
  CommandProvider,
  useRegisterCommands,
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
    <Button onClick={toggleCommands}>
      {activeCommand === 1 ? 'Change command to command two' : 'Change command to command one'}
    </Button>
  )
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
      <div className="flex flex-col gap-2">
        <CommandMenu trigger={<CommandMenuTrigger />}>
          <CommandInput />
          <CommandList />
        </CommandMenu>
        <Commands />
      </div>
    </CommandProvider>
  )
}
