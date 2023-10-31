import { CommandGroup } from 'cmdk'
import { useCommandMenu } from './CommandMenuProvider'
import ChildItem from './ChildItem'
import { useTheme } from 'next-themes'
const ThemeOptions = ({ isSubItem = false }) => {
  const { setIsOpen } = useCommandMenu()
  const { setTheme } = useTheme()
  return (
    <CommandGroup>
      <ChildItem
        isSubItem={isSubItem}
        onSelect={() => {
          setTheme('system')
          setIsOpen(false)
        }}
      >
        Change Theme to the system default
      </ChildItem>
      <ChildItem
        isSubItem={isSubItem}
        onSelect={() => {
          setTheme('dark')
          setIsOpen(false)
        }}
      >
        Change Theme to dark
      </ChildItem>
      <ChildItem
        isSubItem={isSubItem}
        onSelect={() => {
          setTheme('light')
          setIsOpen(false)
        }}
      >
        Change Theme to light
      </ChildItem>
    </CommandGroup>
  )
}

export default ThemeOptions
