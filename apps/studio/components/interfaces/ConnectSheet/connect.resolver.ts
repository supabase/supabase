import type {
  ConditionalValue,
  ConnectSchema,
  ConnectState,
  FieldOption,
  ResolvedField,
  ResolvedStep,
  StepDefinition,
  StepFieldValueMap,
  StepTree,
} from './Connect.types'

/**
 * The order in which state keys are checked during conditional value resolution.
 * Used for ConditionalValue (value-keyed) resolution, not for step trees.
 */
const STATE_KEY_ORDER = [
  'mode',
  'framework',
  'frameworkVariant',
  'library',
  'frameworkUi',
  'orm',
  'connectionMethod',
  'connectionType',
  'mcpClient',
] as const

/**
 * Check if a value is a conditional object (has nested state keys or DEFAULT)
 */
function isConditionalObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Resolves a conditional value based on current state.
 * Walks the tree using stateKeys in order, falling back to DEFAULT at each level.
 *
 * Example: Given state { mode: 'mcp', mcpClient: 'codex' }
 * and stateKeys ['mode', 'framework', ..., 'mcpClient']
 *
 * 1. Look up 'mcp' (state.mode value) in tree -> found, continue
 * 2. At mcp subtree { codex: [...], DEFAULT: [...] }, skip irrelevant keys
 *    until we find a key whose state value matches an entry in the object
 * 3. Look up 'codex' (state.mcpClient value) in that subtree -> found, return value
 * 4. If no state key matches, try DEFAULT at that level
 */
export function resolveConditional<T>(
  value: ConditionalValue<T>,
  state: ConnectState,
  stateKeys: readonly string[] = STATE_KEY_ORDER
): T | undefined {
  // Base case: we've reached a leaf value (string, array, null, boolean, etc.)
  if (!isConditionalObject(value)) {
    return value as T
  }

  const conditionalObj = value as Record<string, ConditionalValue<T>>
  const objectKeys = Object.keys(conditionalObj).filter((k) => k !== 'DEFAULT')

  // Try each state key in order to find one that matches an entry in the object
  for (let i = 0; i < stateKeys.length; i++) {
    const currentKey = stateKeys[i]
    const stateValue = String(state[currentKey] ?? '')

    // If this state value matches a key in the conditional object, use it
    if (stateValue && objectKeys.includes(stateValue)) {
      const nextValue = conditionalObj[stateValue]
      // Continue resolving with remaining keys (after this one)
      return resolveConditional(nextValue, state, stateKeys.slice(i + 1))
    }
  }

  // No state key matched - use DEFAULT if available
  if (conditionalObj.DEFAULT !== undefined) {
    return resolveConditional(conditionalObj.DEFAULT, state, stateKeys)
  }

  return undefined
}

/**
 * Resolves the steps array based on current state.
 * Returns only steps that have non-null content.
 */
export function resolveSteps(schema: ConnectSchema, state: ConnectState): ResolvedStep[] {
  const steps = resolveStepTree(schema.steps, state)
  if (steps.length === 0) return []

  return steps
    .map((step) => {
      const content = resolveConditional<string | null>(step.content, state)
      return {
        id: step.id,
        title: step.title,
        description: step.description,
        content: content ?? '',
      }
    })
    .filter((step) => step.content !== '' && step.content !== null)
}

/**
 * Resolves a step tree by evaluating field-specific branches in insertion order.
 * Each matching branch appends its steps to the final list.
 */
function resolveStepTree(tree: StepTree, state: ConnectState): StepDefinition[] {
  if (Array.isArray(tree)) return tree
  if (!isConditionalObject(tree)) return []

  const resolved: StepDefinition[] = []

  for (const [fieldId, valueMap] of Object.entries(tree)) {
    if (fieldId === 'DEFAULT') continue
    if (!isConditionalObject(valueMap)) continue

    const branch = resolveStepBranch(valueMap as StepFieldValueMap, state[fieldId])
    if (!branch) continue

    resolved.push(...resolveStepTree(branch, state))
  }

  return resolved
}

function resolveStepBranch(
  valueMap: StepFieldValueMap,
  stateValue: ConnectState[keyof ConnectState] | undefined
): StepTree | undefined {
  const key = String(stateValue ?? '')
  if (key && Object.prototype.hasOwnProperty.call(valueMap, key)) {
    return valueMap[key]
  }

  if (valueMap.DEFAULT !== undefined) {
    return valueMap.DEFAULT
  }

  return undefined
}

/**
 * Gets the active fields for the current mode, filtering by dependsOn conditions.
 */
export function getActiveFields(schema: ConnectSchema, state: ConnectState): ResolvedField[] {
  const currentMode = schema.modes.find((m) => m.id === state.mode)
  if (!currentMode) return []

  return currentMode.fields
    .map((fieldId) => schema.fields[fieldId])
    .filter((field): field is NonNullable<typeof field> => !!field)
    .filter((field) => {
      // Check dependsOn conditions
      if (!field.dependsOn) return true
      return Object.entries(field.dependsOn).every(([key, values]) => {
        const stateValue = String(state[key] ?? '')
        return values.includes(stateValue)
      })
    })
    .map((field) => ({
      ...field,
      resolvedOptions: resolveFieldOptions(field, state),
    }))
}

/**
 * Resolves field options based on current state.
 */
function resolveFieldOptions(field: { options?: unknown }, state: ConnectState): FieldOption[] {
  if (!field.options) return []

  // Static options array
  if (Array.isArray(field.options)) {
    return field.options
  }

  // Reference to data source (handled elsewhere)
  if (
    typeof field.options === 'object' &&
    'source' in field.options &&
    typeof field.options.source === 'string'
  ) {
    // This will be resolved by the component using getFieldOptionsFromSource
    return []
  }

  // Conditional options
  const resolved = resolveConditional<FieldOption[]>(
    field.options as ConditionalValue<FieldOption[]>,
    state
  )
  return resolved ?? []
}

/**
 * Gets default state for the schema, using first mode and default field values.
 */
export function getDefaultState(schema: ConnectSchema): ConnectState {
  const defaultMode = schema.modes[0]?.id ?? 'direct'

  const state: ConnectState = { mode: defaultMode }

  // Set default values for all fields
  Object.values(schema.fields).forEach((field) => {
    if (field.defaultValue !== undefined) {
      state[field.id] = field.defaultValue
    }
  })

  return state
}

/**
 * Resets dependent fields when a parent field changes.
 * For example, changing framework should reset frameworkVariant.
 */
export function resetDependentFields(
  state: ConnectState,
  changedFieldId: string,
  schema: ConnectSchema
): ConnectState {
  const newState = { ...state }

  // Find fields that depend on the changed field
  Object.values(schema.fields).forEach((field) => {
    if (field.dependsOn && changedFieldId in field.dependsOn) {
      // Only reset if dependency conditions are no longer satisfied
      const dependencySatisfied = Object.entries(field.dependsOn).every(([key, values]) => {
        const stateValue = String(newState[key] ?? '')
        return values.includes(stateValue)
      })

      if (!dependencySatisfied) {
        delete newState[field.id]
      }
    }
  })

  // Special case: changing mode resets all mode-specific fields
  if (changedFieldId === 'mode') {
    const previousMode = schema.modes.find((m) => m.id !== state.mode)
    const currentMode = schema.modes.find((m) => m.id === state.mode)

    // Reset fields from previous mode that aren't in current mode
    previousMode?.fields.forEach((fieldId) => {
      if (!currentMode?.fields.includes(fieldId)) {
        delete newState[fieldId]
      }
    })
  }

  return newState
}
