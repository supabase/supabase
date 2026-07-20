import { describe, expect, it } from 'vitest'

import { getCheckboxValidationErrors } from './checkboxValidation'

type Field = Parameters<typeof getCheckboxValidationErrors>[0][number]

function checkbox(name: string, label: string, extra: Partial<Field> = {}): Field {
  return { type: 'checkbox', name, label, ...extra } as Field
}

describe('getCheckboxValidationErrors', () => {
  describe('required checkbox group', () => {
    const group = [
      checkbox('a', 'A', { group: 'g', groupRequired: true }),
      checkbox('b', 'B', { group: 'g', groupRequired: true }),
      checkbox('c', 'C', { group: 'g', groupRequired: false }),
    ]

    it('is satisfied by any member, including one without groupRequired', () => {
      // Regression: previously a group only counted its `groupRequired: true` members, so checking
      // only C was wrongly rejected.
      expect(getCheckboxValidationErrors(group, { c: 'true' })).toEqual([])
      expect(getCheckboxValidationErrors(group, { a: 'true' })).toEqual([])
    })

    it('errors and lists every member when nothing in the group is checked', () => {
      expect(getCheckboxValidationErrors(group, {})).toEqual([
        'Please select at least one option: A, B, C',
      ])
    })

    it('does not require a group where no member sets groupRequired', () => {
      const optional = [checkbox('x', 'X', { group: 'opt' }), checkbox('y', 'Y', { group: 'opt' })]
      expect(getCheckboxValidationErrors(optional, {})).toEqual([])
    })
  })

  describe('individually required checkbox', () => {
    it('is enforced even when the checkbox belongs to a group', () => {
      // Regression: the `!f.group` guard used to skip grouped checkboxes entirely.
      const field = checkbox('x', 'X', { required: true, group: 'g' })
      expect(getCheckboxValidationErrors([field], {})).toEqual(['Please confirm: X'])
      expect(getCheckboxValidationErrors([field], { x: 'true' })).toEqual([])
    })

    it('strips a trailing asterisk from the label', () => {
      const field = checkbox('tos', 'I accept the terms *', { required: true })
      expect(getCheckboxValidationErrors([field], {})).toEqual([
        'Please confirm: I accept the terms',
      ])
    })

    it('takes precedence over group errors', () => {
      const fields = [
        checkbox('r', 'R', { required: true }),
        checkbox('p', 'P', { group: 'g', groupRequired: true }),
      ]
      expect(getCheckboxValidationErrors(fields, {})).toEqual(['Please confirm: R'])
    })
  })

  it('matches the live pipelines form behaviour (all groupRequired, none required)', () => {
    const destinations = [
      checkbox('destination_clickhouse', 'ClickHouse', {
        group: 'requested_destinations',
        groupRequired: true,
      }),
      checkbox('destination_snowflake', 'Snowflake', {
        group: 'requested_destinations',
        groupRequired: true,
      }),
      checkbox('destination_ducklake', 'DuckLake', {
        group: 'requested_destinations',
        groupRequired: true,
      }),
    ]
    expect(getCheckboxValidationErrors(destinations, {})).toEqual([
      'Please select at least one option: ClickHouse, Snowflake, DuckLake',
    ])
    expect(getCheckboxValidationErrors(destinations, { destination_snowflake: 'true' })).toEqual([])
  })

  it('ignores non-checkbox fields', () => {
    const fields = [
      { type: 'email', name: 'email', label: 'Email', required: true },
      { type: 'text', name: 'org', label: 'Org', required: true },
    ] as Field[]
    expect(getCheckboxValidationErrors(fields, {})).toEqual([])
  })
})
