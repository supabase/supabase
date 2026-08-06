import type { MarketingFormField } from './MarketingForm'

const isChecked = (field: MarketingFormField, values: Record<string, string>) =>
  values[field.name] === 'true'

/**
 * Validate the checkbox rules HTML5 validation can't express: individually
 * required checkboxes, and groups where at least one member must be selected.
 *
 * A group is required when *any* of its visible members sets
 * `groupRequired: true`, and it is satisfied by *any* member of that group
 * being checked — including members that don't set the flag themselves. This
 * is the contract documented on `checkboxFieldSchema.group`.
 *
 * Returns the messages to surface, empty when the checkboxes pass. Individual
 * `required` failures take precedence so the more specific message wins.
 */
export function validateCheckboxes(
  visibleFields: MarketingFormField[],
  values: Record<string, string>
): string[] {
  const uncheckedRequired = visibleFields.filter(
    (f) => f.type === 'checkbox' && f.required && !isChecked(f, values)
  )
  if (uncheckedRequired.length > 0) {
    return uncheckedRequired.map((f) => `Please confirm: ${f.label.replace(/\*$/, '').trim()}`)
  }

  const groups = new Map<string, { fields: MarketingFormField[]; required: boolean }>()
  visibleFields.forEach((field) => {
    if (field.type !== 'checkbox' || !field.group) return
    const group = groups.get(field.group) ?? { fields: [], required: false }
    group.fields.push(field)
    group.required ||= Boolean(field.groupRequired)
    groups.set(field.group, group)
  })

  return Array.from(groups.values())
    .filter((group) => group.required && !group.fields.some((f) => isChecked(f, values)))
    .map(
      (group) => `Please select at least one option: ${group.fields.map((f) => f.label).join(', ')}`
    )
}
