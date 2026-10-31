import { createContext, useContext, useState, type ReactNode } from 'react'

const MainScrollContainerContext = createContext<HTMLElement | null>(null)
const SetMainScrollContainerContext = createContext<
  React.Dispatch<React.SetStateAction<HTMLElement | null>>
>(() => {})

export const MainScrollContainerProvider = ({ children }: { children: ReactNode }) => {
  const [container, setContainer] = useState<HTMLElement | null>(null)

  return (
    <MainScrollContainerContext.Provider value={container}>
      <SetMainScrollContainerContext.Provider value={setContainer}>
        {children}
      </SetMainScrollContainerContext.Provider>
    </MainScrollContainerContext.Provider>
  )
}

export const useSetMainScrollContainer = () => {
  const context = useContext(SetMainScrollContainerContext)
  return context
}

export const useMainScrollContainer = () => {
  const context = useContext(MainScrollContainerContext)
  return context
}
