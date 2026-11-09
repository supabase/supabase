import type { GoFormFieldShowWhen } from './schemas'

/**
 * Evaluate a `showWhen` rule against the current form values. All supplied
 * criteria must pass (AND). Missing values are treated as the empty string.
 *
 * Used both for field-level visibility gating in the form UI and for
 * provider-level fan-out gating (`sendWhen`) on submit.
 */
export function evaluateShowWhen(
  rule: GoFormFieldShowWhen,
  values: Record<string, string>
): boolean {
  const value = values[rule.field] ?? ''
  if (rule.equals !== undefined && value !== rule.equals) return false
  if (rule.notEquals !== undefined && value === rule.notEquals) return false
  if (rule.in !== undefined && !rule.in.includes(value)) return false
  if (rule.notIn !== undefined && rule.notIn.includes(value)) return false
  if (rule.truthy === true && value === '') return false
  if (rule.truthy === false && value !== '') return false
  return true
}
