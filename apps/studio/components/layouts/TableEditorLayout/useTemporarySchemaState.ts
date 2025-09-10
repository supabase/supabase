import { useMemo, useReducer, useRef } from 'react'

import { useBreakpoint } from 'common/hooks/useBreakpoint'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'

type SchemaState =
  | {
      type: 'synced'
      globalSchema: string
      isMobile: boolean
    }
  | {
      type: 'pending'
      globalSchema: string
      temporarySchema: string
      isMobile: boolean
    }

type SchemaAction =
  | { type: 'EXTERNAL_SCHEMA_CHANGE'; schema: string }
  | { type: 'MOBILE_CHANGE'; isMobile: boolean }
  | { type: 'SELECT_SCHEMA'; schema: string }
  | { type: 'COMMIT_SELECTION' }
  | { type: 'CANCEL_SELECTION' }

/**
 * Manages a state machine for handling two-phase schema selection.
 *
 * On desktop:
 * Schema selection is single-phase. Selecting a schema automatically updates local and global state.
 *
 * On mobile:
 * Schema selection is two-phase:
 * 1. Selecting a schema alters local state.
 * 2. Committing the selection alters global state.
 */
function schemaStateReducer(state: SchemaState, action: SchemaAction): SchemaState {
  switch (action.type) {
    case 'EXTERNAL_SCHEMA_CHANGE':
      return {
        type: 'synced',
        globalSchema: action.schema,
        isMobile: state.isMobile,
      }

    case 'MOBILE_CHANGE':
      if (state.isMobile && !action.isMobile && state.type === 'pending') {
        // Mobile → Desktop: commit pending change
        return {
          type: 'synced',
          globalSchema: state.temporarySchema,
          isMobile: action.isMobile,
        }
      }
      return { ...state, isMobile: action.isMobile }

    case 'SELECT_SCHEMA':
      if (state.isMobile) {
        return {
          type: 'pending',
          globalSchema: state.globalSchema,
          temporarySchema: action.schema,
          isMobile: state.isMobile,
        }
      }
      return {
        type: 'synced',
        globalSchema: action.schema,
        isMobile: state.isMobile,
      }

    case 'COMMIT_SELECTION':
      return {
        type: 'synced',
        globalSchema: state.type === 'pending' ? state.temporarySchema : state.globalSchema,
        isMobile: state.isMobile,
      }

    case 'CANCEL_SELECTION':
      return {
        type: 'synced',
        globalSchema: state.globalSchema,
        isMobile: state.isMobile,
      }

    default:
      return state
  }
}
/**
 * Use two-phase schema selection on mobile.
 *
 * Phase 1: schema changed in local state
 * Phase 2: schema changed in global state (router change)
 */
export function useTemporarySchemaState() {
  const isMobile = useBreakpoint('md')
  const isMobileRef = useRef(isMobile)
  isMobileRef.current = isMobile

  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()

  const [state, dispatch] = useReducer(schemaStateReducer, {
    type: 'synced',
    globalSchema: selectedSchema,
    isMobile,
  })
  const stateRef = useRef(state)
  stateRef.current = state

  // Handle external changes
  if (state.globalSchema !== selectedSchema) {
    dispatch({ type: 'EXTERNAL_SCHEMA_CHANGE', schema: selectedSchema })
  }

  if (state.isMobile !== isMobile) {
    dispatch({ type: 'MOBILE_CHANGE', isMobile })
    if (state.isMobile && !isMobile && state.type === 'pending') {
      setSelectedSchema(state.temporarySchema)
    }
  }

  const actions = useMemo(
    () => ({
      selectSchema: (schema: string, { forceCommit } = { forceCommit: false }) => {
        if (isMobileRef.current && !forceCommit) {
          dispatch({ type: 'SELECT_SCHEMA', schema })
        } else {
          // Directly update global state and let external change detection handle local state
          setSelectedSchema(schema)
        }
      },

      commitSelection: () => {
        if (stateRef.current.type === 'pending') {
          setSelectedSchema(stateRef.current.temporarySchema)
        }
        dispatch({ type: 'COMMIT_SELECTION' })
      },

      cancelSelection: () => {
        dispatch({ type: 'CANCEL_SELECTION' })
      },
    }),
    [isMobileRef, stateRef, setSelectedSchema]
  )

  const effectiveSchema = state.type === 'pending' ? state.temporarySchema : selectedSchema

  return {
    effectiveSchema,
    hasPendingChange: state.type === 'pending',
    actions,
  }
}
