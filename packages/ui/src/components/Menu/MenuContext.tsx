import React, { createContext, useContext } from 'react'

interface ContextProps {
  type: 'text' | 'pills' | 'border'
}

interface Provider extends ContextProps {
  children?: React.ReactNode
}

// Make sure the shape of the default value passed to
// createContext matches the shape that the consumers expect!
const MenuContext = createContext<ContextProps>({
  type: 'text',
})

export const MenuContextProvider = (props: Provider) => {
  const { type } = props

  const value = {
    type: type,
  }

  return (
    <MenuContext.Provider value={value}>{props.children}</MenuContext.Provider>
  )
}

// context helper to avoid using a consumer component
export const useMenuContext = () => {
  const context = useContext(MenuContext)
  if (context === undefined) {
    throw new Error(`MenuContext must be used within a MenuContextProvider.`)
  }
  return context
}
