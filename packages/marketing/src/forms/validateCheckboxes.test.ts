import { describe, expect, it } from 'vitest'

import type { MarketingFormField } from './MarketingForm'
import { validateCheckboxes } from './validateCheckboxes'

const checkbox = (name: string, overrides: Partial<MarketingFormField> = {}): MarketingFormField =>
  ({ type: 'checkbox', name, label: name, ...overrides }) as MarketingFormField

describe('validateCheckboxes', () => {
  it('passes when there is nothing to enforce', () => {
    expect(validateCheckboxes([checkbox('newsletter')], {})).toEqual([])
  })

  describe('individually required checkboxes', () => {
    it('reports an unchecked required checkbox', () => {
      expect(validateCheckboxes([checkbox('terms', { required: true })], {})).toEqual([
        'Please confirm: terms',
      ])
    })

    it('accepts a checked required checkbox', () => {
      expect(
        validateCheckboxes([checkbox('terms', { required: true })], { terms: 'true' })
      ).toEqual([])
    })

    it('strips the trailing asterisk from the label', () => {
      expect(
        validateCheckboxes([checkbox('terms', { label: 'I agree *', required: true })], {})
      ).toEqual(['Please confirm: I agree'])
    })

    // Regression: `required` used to be skipped for any checkbox that also had a
    // `group`, silently dropping its individual enforcement.
    it('still enforces required on a checkbox that also belongs to a group', () => {
      const fields = [checkbox('terms', { required: true, group: 'legal' })]
      expect(validateCheckboxes(fields, {})).toEqual(['Please confirm: terms'])
    })
  })

  describe('required groups', () => {
    const group = [
      checkbox('clickhouse', { group: 'destinations', groupRequired: true }),
      checkbox('snowflake', { group: 'destinations', groupRequired: true }),
    ]

    it('reports a required group with nothing selected', () => {
      expect(validateCheckboxes(group, {})).toEqual([
        'Please select at least one option: clickhouse, snowflake',
      ])
    })

    it('accepts a required group with one member selected', () => {
      expect(validateCheckboxes(group, { snowflake: 'true' })).toEqual([])
    })

    it('ignores groups where no member sets groupRequired', () => {
      const optional = [checkbox('a', { group: 'optional' }), checkbox('b', { group: 'optional' })]
      expect(validateCheckboxes(optional, {})).toEqual([])
    })

    // Regression: the group map was built only from members that set
    // `groupRequired`, so checking a member without the flag did not satisfy
    // the group even though the schema documents that it should.
    it('is satisfied by a member that does not itself set groupRequired', () => {
      const mixed = [
        checkbox('a', { group: 'mixed', groupRequired: true }),
        checkbox('b', { group: 'mixed', groupRequired: true }),
        checkbox('c', { group: 'mixed', groupRequired: false }),
      ]
      expect(validateCheckboxes(mixed, { c: 'true' })).toEqual([])
    })

    it('lists every group member in the error, not just the flagged ones', () => {
      const mixed = [
        checkbox('a', { group: 'mixed', groupRequired: true }),
        checkbox('c', { group: 'mixed', groupRequired: false }),
      ]
      expect(validateCheckboxes(mixed, {})).toEqual(['Please select at least one option: a, c'])
    })

    it('reports each unsatisfied group separately', () => {
      const two = [
        checkbox('a', { group: 'one', groupRequired: true }),
        checkbox('b', { group: 'two', groupRequired: true }),
      ]
      expect(validateCheckboxes(two, {})).toHaveLength(2)
    })
  })

  it('reports individual failures before group failures', () => {
    const fields = [
      checkbox('terms', { required: true }),
      checkbox('a', { group: 'destinations', groupRequired: true }),
    ]
    expect(validateCheckboxes(fields, {})).toEqual(['Please confirm: terms'])
  })

  it('only considers the fields it is given', () => {
    // The caller passes visible fields only, so a hidden required checkbox
    // never reaches validation.
    expect(validateCheckboxes([], { terms: 'false' })).toEqual([])
  })
})
