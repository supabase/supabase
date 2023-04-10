import { CommandGroup } from 'cmdk-supabase'
import { useCommandMenu } from './CommandMenuProvider'
import SearchOnlyItem from './SearchOnlyItem'

const ThemeOptions = ({ isSubItem = false }) => {
  const { setIsOpen, actions } = useCommandMenu()
  return (
    <CommandGroup>
      <SearchOnlyItem
        isSubItem={isSubItem}
        onSelect={() => {
          actions.toggleTheme(true)
          setIsOpen(false)
        }}
      >
        Change Theme to dark
      </SearchOnlyItem>
      <SearchOnlyItem
        isSubItem={isSubItem}
        onSelect={() => {
          actions.toggleTheme(false)
          setIsOpen(false)
        }}
      >
        Change Theme to light
      </SearchOnlyItem>
    </CommandGroup>
  )
}

export default ThemeOptions
