import { CommandGroup } from 'cmdk'
import { useCommandMenu } from './CommandMenuProvider'
import ChildItem from './ChildItem'
import { useTheme } from 'next-themes'
import { Theme, themes } from 'ui/src/components/ThemeProvider/themes'

const ThemeOptions = ({ isSubItem = false }) => {
  const { setIsOpen } = useCommandMenu()
  const { setTheme } = useTheme()
  return (
    <CommandGroup>
      {themes
        .filter((x) => x.name === 'System' || x.name === 'Light' || x.name === 'Dark')
        .map((theme: Theme) => (
          <ChildItem
            key={theme.value}
            isSubItem={isSubItem}
            onSelect={() => {
              setTheme(theme.value)
              document.documentElement.classList.remove('ultra-dark')
              document.documentElement.classList.remove('old-west')
              document.documentElement.classList.remove('party')
              setIsOpen(false)
            }}
          >
            Change Theme to {theme.name === 'System' ? 'System Default' : theme.name}
          </ChildItem>
        ))}
      <ChildItem
        key="ultra-dark-theme"
        isSubItem={false}
        onSelect={() => {
          setTheme('dark')
          document.documentElement.classList.add('ultra-dark')
          document.documentElement.classList.remove('old-west')
          document.documentElement.classList.remove('party')
        }}
      >
        Change Theme to Ultra Dark
      </ChildItem>

      <ChildItem
        key="old-west-theme"
        isSubItem={false}
        onSelect={() => {
          setTheme('light')
          document.documentElement.classList.add('old-west')
          document.documentElement.classList.remove('ultra-dark')
          document.documentElement.classList.remove('party')
        }}
      >
        Change Theme to Old West
      </ChildItem>
      <ChildItem
        key="party-theme"
        isSubItem={false}
        onSelect={() => {
          setTheme('light')
          document.documentElement.classList.add('party')
          document.documentElement.classList.remove('ultra-dark')
          document.documentElement.classList.remove('old-west')
        }}
      >
        Change Theme to Party
      </ChildItem>
    </CommandGroup>
  )
}

export default ThemeOptions
