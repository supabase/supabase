import { useCallback, useMemo, useState } from 'react'

import { FEATURE_GROUPS_PLATFORM, MCP_CLIENTS } from 'ui-patterns/McpUrlBuilder'
import {
  connectionStringMethodOptions,
  DATABASE_CONNECTION_TYPES,
  FRAMEWORKS,
  MOBILES,
  ORMS,
} from './Connect.constants'
import type {
  ConnectMode,
  ConnectSchema,
  ConnectState,
  FieldOption,
  ResolvedField,
  ResolvedStep,
} from './Connect.types'
import { resolveFrameworkLibraryKey } from './Connect.utils'
import {
  getActiveFields,
  getDefaultState,
  resetDependentFields,
  resolveSteps,
} from './connect.resolver'
import { connectSchema } from './connect.schema'

// ============================================================================
// Data Source Helpers
// ============================================================================

/**
 * Get field options from a data source reference.
 * This maps source names to actual data.
 */
function getFieldOptionsFromSource(source: string, state: ConnectState): FieldOption[] {
  switch (source) {
    case 'frameworks':
      return [...FRAMEWORKS, ...MOBILES].map((f) => ({
        value: f.key,
        label: f.label,
        icon: f.icon,
      }))

    case 'frameworkVariants': {
      // Get variants for the selected framework
      const allFrameworks = [...FRAMEWORKS, ...MOBILES]
      const selected = allFrameworks.find((f) => f.key === state.framework)
      if (!selected?.children?.length) return []
      // Only return if there are multiple children (variants)
      if (selected.children.length <= 1) return []
      return selected.children.map((c) => ({
        value: c.key,
        label: c.label,
        icon: c.icon,
      }))
    }

    case 'libraries': {
      // Get libraries for the selected framework and variant
      const allFrameworks = [...FRAMEWORKS, ...MOBILES]
      const selectedFramework = allFrameworks.find((f) => f.key === state.framework)
      if (!selectedFramework) return []

      // If framework has variants, look in the variant
      if (selectedFramework.children?.length > 1 && state.frameworkVariant) {
        const variant = selectedFramework.children.find((c) => c.key === state.frameworkVariant)
        if (variant?.children?.length) {
          return variant.children.map((c) => ({
            value: c.key,
            label: c.label,
            icon: c.icon,
          }))
        }
      }

      // Otherwise look directly in framework children
      if (selectedFramework.children?.length === 1) {
        const child = selectedFramework.children[0]
        if (child.children?.length) {
          return child.children.map((c) => ({
            value: c.key,
            label: c.label,
            icon: c.icon,
          }))
        }
        // The child itself is the library
        return [{ value: child.key, label: child.label, icon: child.icon }]
      }

      return []
    }

    case 'connectionMethods':
      return Object.values(connectionStringMethodOptions).map((m) => ({
        value: m.value,
        label: m.label,
        description: m.description,
      }))

    case 'connectionTypes':
      return DATABASE_CONNECTION_TYPES.map((t) => ({
        value: t.id,
        label: t.label,
      }))

    case 'orms':
      return ORMS.map((o) => ({
        value: o.key,
        label: o.label,
        icon: o.icon,
      }))

    case 'mcpClients':
      return MCP_CLIENTS.map((c) => ({
        value: c.key,
        label: c.label,
        icon: c.icon,
      }))

    case 'mcpFeatures':
      return FEATURE_GROUPS_PLATFORM.map((f) => ({
        value: f.id,
        label: f.name,
        description: f.description,
      }))

    default:
      return []
  }
}

/**
 * Resolve field options, handling both static options and data source references.
 */
function resolveFieldOptionsWithSource(field: ResolvedField, state: ConnectState): FieldOption[] {
  // If already resolved (from conditional resolution)
  if (field.resolvedOptions.length > 0) {
    return field.resolvedOptions
  }

  // Check if it's a source reference
  const options = connectSchema.fields[field.id]?.options
  if (options && typeof options === 'object' && 'source' in options) {
    return getFieldOptionsFromSource(options.source as string, state)
  }

  return []
}

// ============================================================================
// Hook
// ============================================================================

export interface UseConnectStateReturn {
  state: ConnectState
  updateField: (fieldId: string, value: string | boolean | string[]) => void
  setMode: (mode: ConnectMode) => void
  activeFields: ResolvedField[]
  resolvedSteps: ResolvedStep[]
  getFieldOptions: (fieldId: string) => FieldOption[]
  schema: ConnectSchema
}

export function useConnectState(initialState?: Partial<ConnectState>): UseConnectStateReturn {
  const [state, setState] = useState<ConnectState>(() => {
    const defaults = getDefaultState(connectSchema)

    // Set initial framework if mode is framework
    if (defaults.mode === 'framework' && !defaults.framework) {
      const firstFramework = FRAMEWORKS[0]
      defaults.framework = firstFramework?.key ?? ''

      // Set initial variant if framework has variants
      if (firstFramework?.children?.length > 1) {
        defaults.frameworkVariant = firstFramework.children[0]?.key ?? ''
      }

      // Set initial library
      const libraryKey = resolveFrameworkLibraryKey({
        framework: defaults.framework,
        frameworkVariant: defaults.frameworkVariant,
        library: defaults.library,
      })
      if (libraryKey) defaults.library = libraryKey
    }

    // Set initial ORM if mode is orm
    if (defaults.mode === 'orm' && !defaults.orm) {
      defaults.orm = ORMS[0]?.key ?? ''
    }

    // Set initial MCP client if mode is mcp
    if (defaults.mode === 'mcp' && !defaults.mcpClient) {
      defaults.mcpClient = MCP_CLIENTS[0]?.key ?? ''
    }

    return { ...defaults, ...initialState } as ConnectState
  })

  const updateField = useCallback((fieldId: string, value: string | boolean | string[]) => {
    setState((prev) => {
      const next = { ...prev, [fieldId]: value }

      // Handle cascading updates for framework selection
      if (fieldId === 'framework') {
        const allFrameworks = [...FRAMEWORKS, ...MOBILES]
        const selected = allFrameworks.find((f) => f.key === value)

        // Reset variant if framework changed
        if (selected?.children && selected.children.length > 1) {
          next.frameworkVariant = selected.children[0]?.key ?? ''
        } else {
          delete next.frameworkVariant
        }

        // Reset library
        const libraryKey = resolveFrameworkLibraryKey({
          framework: next.framework,
          frameworkVariant: next.frameworkVariant,
          library: next.library,
        })
        if (libraryKey) {
          next.library = libraryKey
        } else {
          delete next.library
        }
      }

      // Handle cascading updates for variant selection
      if (fieldId === 'frameworkVariant') {
        const libraryKey = resolveFrameworkLibraryKey({
          framework: prev.framework,
          frameworkVariant: String(value),
          library: next.library,
        })
        if (libraryKey) next.library = libraryKey
      }

      // Reset useSharedPooler when connectionMethod changes to 'direct'
      if (fieldId === 'connectionMethod' && value === 'direct') {
        next.useSharedPooler = false
      }

      return resetDependentFields(next, fieldId, connectSchema)
    })
  }, [])

  const setMode = useCallback((mode: ConnectMode) => {
    setState((prev) => {
      const next: ConnectState = { ...prev, mode }

      // Initialize mode-specific defaults
      if (mode === 'framework' && !next.framework) {
        const firstFramework = FRAMEWORKS[0]
        next.framework = firstFramework?.key ?? ''
        if (firstFramework?.children?.length > 1) {
          next.frameworkVariant = firstFramework.children[0]?.key ?? ''
        }
        const libraryKey = resolveFrameworkLibraryKey({
          framework: next.framework,
          frameworkVariant: next.frameworkVariant,
          library: next.library,
        })
        if (libraryKey) next.library = libraryKey
      }

      if (mode === 'direct') {
        next.connectionMethod = next.connectionMethod ?? 'direct'
        next.connectionType = next.connectionType ?? 'uri'
      }

      if (mode === 'orm' && !next.orm) {
        next.orm = ORMS[0]?.key ?? ''
      }

      if (mode === 'mcp' && !next.mcpClient) {
        next.mcpClient = MCP_CLIENTS[0]?.key ?? ''
      }

      return next
    })
  }, [])

  const activeFields = useMemo(() => getActiveFields(connectSchema, state), [state])

  const resolvedSteps = useMemo(() => resolveSteps(connectSchema, state), [state])

  const getFieldOptions = useCallback(
    (fieldId: string): FieldOption[] => {
      const field = activeFields.find((f) => f.id === fieldId)
      if (!field) return []
      return resolveFieldOptionsWithSource(field, state)
    },
    [activeFields, state]
  )

  return {
    state,
    updateField,
    setMode,
    activeFields,
    resolvedSteps,
    getFieldOptions,
    schema: connectSchema,
  }
}
