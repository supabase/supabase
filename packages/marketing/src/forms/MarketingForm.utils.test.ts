import { describe, expect, it } from 'vitest'

import { validateCheckboxFields, type MarketingFormField } from './MarketingForm.utils'

const checkbox = (
  name: string,
  overrides: Partial<Extract<MarketingFormField, { type: 'checkbox' }>> = {}
): MarketingFormField => ({ type: 'checkbox', name, label: name, ...overrides })

/** Build the `values` record the form holds, marking `checked` names as selected. */
const valuesWith = (fields: MarketingFormField[], checked: string[]): Record<string, string> =>
  Object.fromEntries(fields.map((f) => [f.name, checked.includes(f.name) ? 'true' : 'false']))

describe('validateCheckboxFields', () => {
  it('accepts a form with no checkboxes', () => {
    const fields: MarketingFormField[] = [{ type: 'email', name: 'email', label: 'Email' }]

    expect(validateCheckboxFields(fields, { email: 'a@b.com' })).toEqual([])
  })

  describe('individually required checkboxes', () => {
    it('rejects an unchecked required checkbox', () => {
      const fields = [checkbox('terms', { label: 'I accept the terms*', required: true })]

      expect(validateCheckboxFields(fields, valuesWith(fields, []))).toEqual([
        'Please confirm: I accept the terms',
      ])
    })

    it('accepts a checked required checkbox', () => {
      const fields = [checkbox('terms', { label: 'I accept the terms*', required: true })]

      expect(validateCheckboxFields(fields, valuesWith(fields, ['terms']))).toEqual([])
    })

    // The form seeds every value to '' on mount, so an untouched checkbox is
    // never literally 'false'.
    it('treats an untouched checkbox as unchecked', () => {
      const fields = [checkbox('terms', { label: 'Terms', required: true })]

      expect(validateCheckboxFields(fields, { terms: '' })).toEqual(['Please confirm: Terms'])
    })

    it('ignores a checkbox that is not required', () => {
      const fields = [checkbox('optIn', { label: 'Send me updates' })]

      expect(validateCheckboxFields(fields, valuesWith(fields, []))).toEqual([])
    })

    // Regression: the individual check used to skip any checkbox with a `group`,
    // so `required: true` was silently unenforced on grouped checkboxes.
    it('enforces `required` on a checkbox that also belongs to a group', () => {
      const fields = [
        checkbox('a', { label: 'A', group: 'g', groupRequired: true, required: true }),
        checkbox('b', { label: 'B', group: 'g', groupRequired: true }),
      ]

      expect(validateCheckboxFields(fields, valuesWith(fields, ['b']))).toEqual([
        'Please confirm: A',
      ])
    })

    it('reports every unchecked required checkbox', () => {
      const fields = [
        checkbox('terms', { label: 'Terms', required: true }),
        checkbox('privacy', { label: 'Privacy', required: true }),
      ]

      expect(validateCheckboxFields(fields, valuesWith(fields, []))).toEqual([
        'Please confirm: Terms',
        'Please confirm: Privacy',
      ])
    })
  })

  describe('grouped checkboxes', () => {
    it('rejects a required group with nothing selected', () => {
      const fields = [
        checkbox('a', { label: 'A', group: 'g', groupRequired: true }),
        checkbox('b', { label: 'B', group: 'g', groupRequired: true }),
      ]

      expect(validateCheckboxFields(fields, valuesWith(fields, []))).toEqual([
        'Please select at least one option: A, B',
      ])
    })

    it('accepts a required group with one member selected', () => {
      const fields = [
        checkbox('a', { label: 'A', group: 'g', groupRequired: true }),
        checkbox('b', { label: 'B', group: 'g', groupRequired: true }),
      ]

      expect(validateCheckboxFields(fields, valuesWith(fields, ['b']))).toEqual([])
    })

    // Regression: the group used to be built only from members setting
    // `groupRequired`, so selecting an unflagged member left the group "empty".
    it('lets a member without `groupRequired` satisfy the group', () => {
      const fields = [
        checkbox('a', { label: 'A', group: 'g', groupRequired: true }),
        checkbox('b', { label: 'B', group: 'g', groupRequired: true }),
        checkbox('c', { label: 'C', group: 'g', groupRequired: false }),
      ]

      expect(validateCheckboxFields(fields, valuesWith(fields, ['c']))).toEqual([])
    })

    it('lists every member of an unsatisfied group, not just the flagged ones', () => {
      const fields = [
        checkbox('a', { label: 'A', group: 'g', groupRequired: true }),
        checkbox('c', { label: 'C', group: 'g', groupRequired: false }),
      ]

      expect(validateCheckboxFields(fields, valuesWith(fields, []))).toEqual([
        'Please select at least one option: A, C',
      ])
    })

    it('ignores a group where no member sets `groupRequired`', () => {
      const fields = [
        checkbox('a', { label: 'A', group: 'g' }),
        checkbox('b', { label: 'B', group: 'g' }),
      ]

      expect(validateCheckboxFields(fields, valuesWith(fields, []))).toEqual([])
    })

    it('validates each group independently', () => {
      const fields = [
        checkbox('a1', { label: 'A1', group: 'a', groupRequired: true }),
        checkbox('b1', { label: 'B1', group: 'b', groupRequired: true }),
      ]

      expect(validateCheckboxFields(fields, valuesWith(fields, ['a1']))).toEqual([
        'Please select at least one option: B1',
      ])
    })

    // `visibleFields` is already filtered by `showWhen`, so a hidden member
    // neither arms a group nor can satisfy one.
    it('only considers the fields it is given', () => {
      const hidden = checkbox('hidden', { label: 'Hidden', group: 'g', groupRequired: true })
      const visible = [checkbox('shown', { label: 'Shown', group: 'g' })]

      expect(validateCheckboxFields(visible, valuesWith([...visible, hidden], []))).toEqual([])
    })
  })

  it('reports required-checkbox errors before group errors', () => {
    const fields = [
      checkbox('terms', { label: 'Terms', required: true }),
      checkbox('a', { label: 'A', group: 'g', groupRequired: true }),
    ]

    expect(validateCheckboxFields(fields, valuesWith(fields, []))).toEqual([
      'Please confirm: Terms',
    ])
  })
})
