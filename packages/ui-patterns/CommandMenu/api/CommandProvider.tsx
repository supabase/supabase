import { useMemo, useState } from 'react'

import { type ICommand } from '../internal/Command'
import { CommandContext } from '../internal/Context'

const CommandProvider = () => {
  const [commands, setCommands] = useState<Array<ICommand>>([])

  const ctx = useMemo(
    () => ({
      commands,
      setCommands,
    }),
    [commands]
  )

  return <CommandContext.Provider value={ctx} />
}

export { CommandProvider }
