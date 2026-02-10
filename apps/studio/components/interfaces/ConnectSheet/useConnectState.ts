import { useCallback, useMemo, useState } from 'react'

import { getActiveFields, resolveState, resolveSteps } from './connect.resolver'
import { connectSchema } from './connect.schema'
import type {
  ConnectSchema,
  ConnectState,
  FieldOption,
  ResolvedField,
  ResolvedStep,
} from './Connect.types'

export interface UseConnectStateReturn {
  state: ConnectState
  updateField: (fieldId: string, value: string | boolean | string[]) => void
  activeFields: ResolvedField[]
  resolvedSteps: ResolvedStep[]
  getFieldOptions: (fieldId: string) => FieldOption[]
  schema: ConnectSchema
}

export function useConnectState(initialState?: Partial<ConnectState>): UseConnectStateReturn {
  const [state, setState] = useState<ConnectState>(() => {
    return resolveState(connectSchema, initialState ?? {})
  })

  const updateField = useCallback((fieldId: string, value: string | boolean | string[]) => {
    setState((prev) => {
      const next = { ...prev, [fieldId]: value }
      return resolveState(connectSchema, next)
    })
  }, [])

  const activeFields = useMemo(() => getActiveFields(connectSchema, state), [state])

  const resolvedSteps = useMemo(() => resolveSteps(connectSchema, state), [state])

  const getFieldOptions = useCallback(
    (fieldId: string): FieldOption[] => {
      const field = activeFields.find((f) => f.id === fieldId)
      if (!field) return []
      return field.resolvedOptions
    },
    [activeFields]
  )

  return {
    state,
    updateField,
    activeFields,
    resolvedSteps,
    getFieldOptions,
    schema: connectSchema,
  }
}
