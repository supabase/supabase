import { CommandGroup } from 'cmdk'
import { useCommandMenu } from './CommandMenuProvider'
import ChildItem from './ChildItem'
import { useTheme } from 'next-themes'
import { Theme, themes } from 'ui'

const ThemeOptions = ({ isSubItem = false }) => {
  const { setIsOpen } = useCommandMenu()
  const { setTheme } = useTheme()
  return (
    <CommandGroup>
      {themes.map((theme: Theme) => (
        <ChildItem
          key={theme.value}
          isSubItem={isSubItem}
          onSelect={() => {
            setTheme(theme.value)
            setIsOpen(false)
          }}
        >
          Change Theme to {theme.name === 'System' ? 'System Default' : theme.name}
        </ChildItem>
      ))}
    </CommandGroup>
  )
}

export default ThemeOptions
