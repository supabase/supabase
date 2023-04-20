import { CommandGroup } from 'cmdk-supabase'
import { useCommandMenu } from './CommandMenuProvider'
import ChildItem from './ChildItem'

const ThemeOptions = ({ isSubItem = false }) => {
  const { setIsOpen, actions } = useCommandMenu()
  return (
    <CommandGroup>
      <ChildItem
        isSubItem={isSubItem}
        onSelect={() => {
          actions.toggleTheme(true)
          setIsOpen(false)
        }}
      >
        Change Theme to dark
      </ChildItem>
      <ChildItem
        isSubItem={isSubItem}
        onSelect={() => {
          actions.toggleTheme(false)
          setIsOpen(false)
        }}
      >
        Change Theme to light
      </ChildItem>
    </CommandGroup>
  )
}

export default ThemeOptions
