import { createContext, useContext } from 'react'

interface ContextProps {
  activeRefItem: string
  setActiveRefItem: (x: string) => void
}

interface Provider extends ContextProps {
  children?: React.ReactNode
}

// Make sure the shape of the default value passed to
// createContext matches the shape that the consumers expect!
const NavMenuContext = createContext<ContextProps>({
  activeRefItem: undefined,
  setActiveRefItem: undefined,
})

export const NavigationMenuContextProvider = (props: Provider) => {
  const { activeRefItem, setActiveRefItem } = props

  const value = {
    activeRefItem,
    setActiveRefItem,
  }

  return <NavMenuContext.Provider value={value}>{props.children}</NavMenuContext.Provider>
}

// context helper to avoid using a consumer component
export const useNavigationMenuContext = () => {
  const context = useContext(NavMenuContext)
  if (context === undefined) {
    throw new Error(`useFormContextOnChange must be used within a FormContextProvider.`)
  }
  return context
}
