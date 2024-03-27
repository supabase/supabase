import { useCommandSectionsContext } from '../internal/Context'

const CommandList = () => {
  const { commandSections } = useCommandSectionsContext()

  return (
    <>
      {commandSections.map((section) => (
        <></>
      ))}
    </>
  )
}

export { CommandList }
