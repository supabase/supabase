// ============================================================================
// Project Keys (existing)
// ============================================================================

export type ProjectKeys = {
  apiUrl: string | null
  anonKey: string | null
  publishableKey: string | null
}

// ============================================================================
// Connection Strings
// ============================================================================

export interface ConnectionStringPooler {
  transactionShared: string
  sessionShared: string
  transactionDedicated?: string
  sessionDedicated?: string
  ipv4SupportedForDedicatedPooler: boolean
  direct?: string
}

// ============================================================================
// Schema Types - Conditional Resolution
// ============================================================================

/**
 * A value that can be resolved conditionally based on state.
 * Resolution walks the tree using state values, falling back to DEFAULT.
 *
 * Example:
 * {
 *   framework: {
 *     nextjs: 'NextJsContent',
 *     react: 'ReactContent',
 *     DEFAULT: 'GenericFrameworkContent'
 *   },
 *   direct: 'DirectContent',
 *   DEFAULT: null
 * }
 */
export type ConditionalValue<T> =
  | T
  | {
      [stateValue: string]: ConditionalValue<T> | undefined
      DEFAULT?: T
    }

// ============================================================================
// Schema Types - Modes
// ============================================================================

export type ConnectMode = 'framework' | 'direct' | 'orm' | 'mcp'

export interface ModeDefinition {
  id: ConnectMode
  label: string
  description: string
  icon?: string
  fields: string[] // References to field IDs
}

// ============================================================================
// Schema Types - Fields
// ============================================================================

type FieldType = 'select' | 'radio-grid' | 'radio-list' | 'switch' | 'multi-select'

export interface FieldOption {
  value: string
  label: string
  icon?: string
  description?: string
}

type FieldOptionsResolver = (state: ConnectState) => FieldOption[]

interface FieldDefinition {
  id: string
  type: FieldType
  label: string
  description?: string
  // Options can be static, or reference a data source, or be conditional
  options?: FieldOption[] | { source: string } | ConditionalValue<FieldOption[]>
  // Only show this field when these state conditions are met
  dependsOn?: Record<string, string[]>
  // Default value for this field
  defaultValue?: string | boolean | string[]
}

// ============================================================================
// Schema Types - Steps
// ============================================================================

export interface StepDefinition {
  id: string
  title: string
  description: string
  // Component identifier or content file path, can be conditional
  content: ConditionalValue<string | null>
}

export type StepTree =
  | StepDefinition[]
  | {
      [fieldId: string]: StepFieldValueMap
    }

export type StepFieldValueMap = {
  [fieldValue: string]: StepTree | undefined
  DEFAULT?: StepTree
}

// ============================================================================
// Schema Types - Main Schema
// ============================================================================

export interface ConnectSchema {
  modes: ModeDefinition[]
  fields: Record<string, FieldDefinition>
  // Steps are fully conditional based on state
  steps: StepTree
}

// ============================================================================
// State Types
// ============================================================================

export interface ConnectState {
  mode: ConnectMode
  [fieldId: string]: string | boolean | string[]
}

export interface ResolvedStep {
  id: string
  title: string
  description: string
  content: string // Resolved component identifier
}

export interface ResolvedField extends FieldDefinition {
  resolvedOptions: FieldOption[]
}

// ============================================================================
// Step Content Props - Unified props for all step content components
// ============================================================================

/**
 * Props passed to all step content components.
 * Components receive full state and can conditionally render whatever they need.
 */
export interface StepContentProps {
  state: ConnectState
  projectKeys: ProjectKeys
  connectionStringPooler: ConnectionStringPooler
}
