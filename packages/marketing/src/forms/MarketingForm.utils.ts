import type { z } from 'zod'

import type { formFieldSchema } from '../go/schemas'

/** Input-shape field type — fields with Zod defaults (`half`, `required`) are optional here. */
export type MarketingFormField = z.input<typeof formFieldSchema>

type MarketingCheckboxField = Extract<MarketingFormField, { type: 'checkbox' }>

/** A checkbox is checked only when its value is the string 'true' — it starts out ''. */
const isChecked = (field: MarketingFormField, values: Record<string, string>) =>
  values[field.name] === 'true'

/** Strip the trailing asterisk some labels use to mark themselves as required. */
const toPlainLabel = (label: string) => label.replace(/\*$/, '').trim()

/**
 * Validate the checkbox rules that HTML5 validation can't express, in the order
 * they are reported to the user:
 *
 * 1. Every checkbox with `required: true` must be checked — including one that
 *    also belongs to a group.
 * 2. When any visible checkbox in a group sets `groupRequired: true`, at least
 *    one checkbox in that group must be checked. Members that don't set the flag
 *    still count towards satisfying it.
 *
 * Both rules match the contract documented on `checkboxFieldSchema`.
 *
 * @param visibleFields Fields currently rendered, i.e. after `showWhen` filtering.
 * @param values Current form values, keyed by field name.
 * @returns Error messages to show, empty when the checkboxes validate.
 */
export function validateCheckboxFields(
  visibleFields: MarketingFormField[],
  values: Record<string, string>
): string[] {
  const uncheckedRequired = visibleFields.filter(
    (field) => field.type === 'checkbox' && field.required && !isChecked(field, values)
  )
  if (uncheckedRequired.length > 0) {
    return uncheckedRequired.map((field) => `Please confirm: ${toPlainLabel(field.label)}`)
  }

  // Collect every member of a group, not just the ones setting `groupRequired`,
  // so that checking any member of the group satisfies the requirement.
  const checkboxGroups = new Map<string, MarketingCheckboxField[]>()
  visibleFields.forEach((field) => {
    if (field.type !== 'checkbox' || !field.group) return
    const groupFields = checkboxGroups.get(field.group) ?? []
    groupFields.push(field)
    checkboxGroups.set(field.group, groupFields)
  })

  const unsatisfiedGroups = Array.from(checkboxGroups.values()).filter(
    (group) =>
      group.some((field) => field.groupRequired) &&
      group.every((field) => !isChecked(field, values))
  )
  return unsatisfiedGroups.map(
    (group) => `Please select at least one option: ${group.map((field) => field.label).join(', ')}`
  )
}
