import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

import type { ShortcutDefinition } from './types'

export type ActiveShortcutDefinition = Pick<
  ShortcutDefinition,
  'id' | 'label' | 'sequence' | 'referenceGroup'
>

interface ActiveShortcutsContextValue {
  activeShortcuts: ActiveShortcutDefinition[]
  registerActiveShortcut: (instanceId: string, definition: ActiveShortcutDefinition) => void
  unregisterActiveShortcut: (instanceId: string) => void
}

const ActiveShortcutsContext = createContext<ActiveShortcutsContextValue>({
  activeShortcuts: [],
  registerActiveShortcut: () => {},
  unregisterActiveShortcut: () => {},
})

const isSameActiveShortcut = (
  a: ActiveShortcutDefinition | undefined,
  b: ActiveShortcutDefinition
) => {
  return (
    a?.id === b.id &&
    a.label === b.label &&
    a.sequence === b.sequence &&
    a.referenceGroup === b.referenceGroup
  )
}

export function ActiveShortcutsProvider({ children }: PropsWithChildren) {
  const [activeByInstanceId, setActiveByInstanceId] = useState<
    Record<string, ActiveShortcutDefinition>
  >({})

  const registerActiveShortcut = useCallback(
    (instanceId: string, definition: ActiveShortcutDefinition) => {
      setActiveByInstanceId((current) => {
        if (isSameActiveShortcut(current[instanceId], definition)) return current
        return { ...current, [instanceId]: definition }
      })
    },
    []
  )

  const unregisterActiveShortcut = useCallback((instanceId: string) => {
    setActiveByInstanceId((current) => {
      if (!(instanceId in current)) return current

      const { [instanceId]: _removed, ...next } = current
      return next
    })
  }, [])

  const activeShortcuts = useMemo(() => Object.values(activeByInstanceId), [activeByInstanceId])

  const value = useMemo(
    () => ({ activeShortcuts, registerActiveShortcut, unregisterActiveShortcut }),
    [activeShortcuts, registerActiveShortcut, unregisterActiveShortcut]
  )

  return (
    <ActiveShortcutsContext.Provider value={value}>{children}</ActiveShortcutsContext.Provider>
  )
}

export function useActiveShortcuts() {
  return useContext(ActiveShortcutsContext).activeShortcuts
}

export function useRegisterActiveShortcut(
  definition: ActiveShortcutDefinition,
  enabled: boolean
) {
  const { id, label, sequence, referenceGroup } = definition
  const instanceId = useId()
  const { registerActiveShortcut, unregisterActiveShortcut } = useContext(ActiveShortcutsContext)

  useEffect(() => {
    if (!enabled) {
      unregisterActiveShortcut(instanceId)
      return
    }

    registerActiveShortcut(instanceId, { id, label, sequence, referenceGroup })

    return () => unregisterActiveShortcut(instanceId)
  }, [
    enabled,
    id,
    instanceId,
    label,
    referenceGroup,
    registerActiveShortcut,
    sequence,
    unregisterActiveShortcut,
  ])
}
