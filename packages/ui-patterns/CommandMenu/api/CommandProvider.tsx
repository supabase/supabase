import { type PropsWithChildren, type ReactNode, useMemo, useState, useCallback } from 'react'

import {
  CommandPagesContext,
  CommandSectionsContext,
  type ICommandPageName,
} from '../internal/Context'
import { type ICommandSection } from '../internal/CommandSection'

const CommandSectionsProvider = ({ children }: PropsWithChildren) => {
  const [commandSections, setCommandSections] = useState<Array<ICommandSection>>([])

  const ctx = useMemo(
    () => ({
      commandSections,
      setCommandSections,
    }),
    [commandSections]
  )

  return <CommandSectionsContext.Provider value={ctx}>{children}</CommandSectionsContext.Provider>
}

const CommandPagesProvider = ({ children }: PropsWithChildren) => {
  const [commandPages, setCommandPages] = useState<Record<ICommandPageName, () => ReactNode>>({})
  const [pageStack, setPageStack] = useState<Array<ICommandPageName>>([])

  const addCommandPage = useCallback((name: ICommandPageName, component: () => ReactNode) => {
    setCommandPages({ ...commandPages, [name]: component })
    return () => setCommandPages(object$del<Record<string, () => ReactNode>>(commandPages, name))
  }, [])

  const appendPageStack = useCallback(
    (page: ICommandPageName) => setPageStack((pageStack) => [...pageStack, page]),
    []
  )

  const popPageStack = useCallback(() => setPageStack(pageStack.slice(0, pageStack.length - 1)), [])

  const ctx = useMemo(
    () => ({
      commandPages,
      addCommandPage,
      pageStack,
      appendPageStack,
      popPageStack,
    }),
    [commandPages]
  )

  return <CommandPagesContext.Provider value={ctx}>{children}</CommandPagesContext.Provider>
}

const object$del = <O extends object = object>(obj: O, prop: keyof O) => {
  const objCopy = { ...obj }
  delete objCopy[prop]
  return objCopy
}

const CommandProvider = ({ children }: PropsWithChildren) => (
  <CommandPagesProvider>
    <CommandSectionsProvider>{children}</CommandSectionsProvider>
  </CommandPagesProvider>
)

export { CommandProvider }
