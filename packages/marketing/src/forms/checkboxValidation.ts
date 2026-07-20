import type { z } from 'zod'

import type { formFieldSchema } from '../go/schemas'

// z.input (not z.infer) so fields with Zod defaults (`required`, `groupRequired`) stay optional —
// the shape MarketingForm actually holds. Structurally identical to MarketingFormField.
type FormField = z.input<typeof formFieldSchema>

/**
 * Client-side validation for checkbox fields, which HTML5 `required` doesn't cover:
 *
 * - A checkbox with `required: true` must be checked.
 * - A checkbox group is required when any of its members sets `groupRequired: true`; a required
 *   group is satisfied by checking any one of its members (see `checkboxFieldSchema`).
 *
 * Returns human-readable error messages, or an empty array when everything is satisfied.
 * Individual-required errors take precedence over group errors.
 */
export function getCheckboxValidationErrors(
  fields: FormField[],
  values: Record<string, string>
): string[] {
  const uncheckedRequired = fields.filter(
    (f) => f.type === 'checkbox' && f.required && values[f.name] !== 'true'
  )
  if (uncheckedRequired.length > 0) {
    return uncheckedRequired.map((f) => `Please confirm: ${f.label.replace(/\*$/, '').trim()}`)
  }

  const groups = new Map<string, { fields: FormField[]; required: boolean }>()
  fields.forEach((field) => {
    if (field.type !== 'checkbox' || !field.group) return
    const group = groups.get(field.group) ?? { fields: [], required: false }
    group.fields.push(field)
    group.required = group.required || Boolean(field.groupRequired)
    groups.set(field.group, group)
  })

  return Array.from(groups.values())
    .filter((group) => group.required && group.fields.every((f) => values[f.name] !== 'true'))
    .map(
      (group) => `Please select at least one option: ${group.fields.map((f) => f.label).join(', ')}`
    )
}
