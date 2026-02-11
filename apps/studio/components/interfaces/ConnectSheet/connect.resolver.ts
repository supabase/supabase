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
 * and stateKeys derived from schema field order
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
  stateKeys: readonly string[] = Object.keys(state)
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
  const stateKeys = Object.keys(schema.fields)
  const resolutionKeys = stateKeys.length > 0 ? stateKeys : Object.keys(state)

  return steps
    .map((step) => {
      const content = resolveConditional<string | null>(step.content, state, resolutionKeys)
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
  const stateKeys = Object.keys(schema.fields)

  return stateKeys
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
      resolvedOptions: resolveFieldOptions(field, state, stateKeys),
    }))
}

/**
 * Resolves field options based on current state.
 */
function resolveFieldOptions(
  field: { options?: unknown },
  state: ConnectState,
  stateKeys: readonly string[]
): FieldOption[] {
  if (!field.options) return []

  // Static options array
  if (Array.isArray(field.options)) {
    return field.options
  }

  if (typeof field.options === 'function') {
    return (field.options as (state: ConnectState) => FieldOption[])(state)
  }

  // Conditional options
  if (typeof field.options === 'object') {
    const resolved = resolveConditional<FieldOption[]>(
      field.options as ConditionalValue<FieldOption[]>,
      state,
      stateKeys
    )
    return resolved ?? []
  }

  return []
}

/**
 * Normalizes state values based on schema defaults, options, and dependencies.
 */
export function resolveState(
  schema: ConnectSchema,
  inputState: Partial<ConnectState>
): ConnectState {
  const next: ConnectState = { ...(inputState as ConnectState) }

  const maxIterations = Math.max(1, Object.keys(schema.fields).length + 1)

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let changed = false
    const activeFields = getActiveFields(schema, next)

    for (const field of activeFields) {
      const currentValue = next[field.id]
      const optionValues = field.resolvedOptions.map((option) => option.value)
      const hasOptions = optionValues.length > 0

      if (field.type === 'switch') {
        if (typeof currentValue !== 'boolean' && typeof field.defaultValue === 'boolean') {
          next[field.id] = field.defaultValue
          changed = true
        }
        continue
      }

      if (field.type === 'multi-select') {
        if (Array.isArray(currentValue)) {
          if (hasOptions) {
            const filtered = currentValue.filter((value) => optionValues.includes(String(value)))
            if (filtered.length !== currentValue.length) {
              next[field.id] = filtered
              changed = true
            }
          }
        } else if (Array.isArray(field.defaultValue)) {
          next[field.id] = field.defaultValue
          changed = true
        }
        continue
      }

      if (typeof currentValue !== 'string') {
        let nextValue: string | undefined

        if (
          typeof field.defaultValue === 'string' &&
          (!hasOptions || optionValues.includes(field.defaultValue))
        ) {
          nextValue = field.defaultValue
        } else if (hasOptions) {
          nextValue = optionValues[0]
        }

        if (nextValue !== undefined) {
          next[field.id] = nextValue
          changed = true
        }
        continue
      }

      if (hasOptions && !optionValues.includes(currentValue)) {
        let nextValue: string | undefined

        if (typeof field.defaultValue === 'string' && optionValues.includes(field.defaultValue)) {
          nextValue = field.defaultValue
        } else {
          nextValue = optionValues[0]
        }

        if (nextValue !== currentValue) {
          next[field.id] = nextValue
          changed = true
        }
      }
    }

    if (!changed) break
  }

  const activeIds = new Set(getActiveFields(schema, next).map((field) => field.id))
  Object.keys(schema.fields).forEach((fieldId) => {
    if (!activeIds.has(fieldId)) {
      delete next[fieldId]
    }
  })

  return next
}

/**
 * Gets default state for the schema, using first mode and default field values.
 */
export function getDefaultState(schema: ConnectSchema): ConnectState {
  return resolveState(schema, {})
}
