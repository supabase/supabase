import { describe, expect, test } from 'vitest'

/**
 * Tests for the composite foreign key filtering logic used in
 * SidePanelEditor.onSaveForeignRow. When a user double-clicks a single FK
 * column in the grid (e.g. role_id), and the FK is composite (role_id + tenant_id),
 * only the clicked column should be sent in the UPDATE payload.
 *
 * See: https://github.com/supabase/supabase/issues/41085
 */

/**
 * Mirrors the filtering logic in SidePanelEditor.onSaveForeignRow:
 *
 *   const filteredValue =
 *     value && editedColumn?.name ? { [editedColumn.name]: value[editedColumn.name] } : value
 */
function filterForeignRowValue(
  value: Record<string, unknown> | undefined,
  editedColumnName: string | undefined
): Record<string, unknown> | undefined {
  return value && editedColumnName ? { [editedColumnName]: value[editedColumnName] } : value
}

describe('Composite FK: only the clicked column is included in the update payload', () => {
  test('filters composite FK value to only the edited column', () => {
    // User double-clicked role_id, FK selector returns both role_id and tenant_id
    const fkSelectorValue = { role_id: 'role-2', tenant_id: 'tenant-B' }
    const editedColumn = 'role_id'

    const result = filterForeignRowValue(fkSelectorValue, editedColumn)

    // Only role_id should be in the payload - tenant_id should NOT be silently updated
    expect(result).toEqual({ role_id: 'role-2' })
    expect(result).not.toHaveProperty('tenant_id')
  })

  test('filters composite FK value when tenant_id is clicked', () => {
    const fkSelectorValue = { role_id: 'role-2', tenant_id: 'tenant-B' }
    const editedColumn = 'tenant_id'

    const result = filterForeignRowValue(fkSelectorValue, editedColumn)

    expect(result).toEqual({ tenant_id: 'tenant-B' })
    expect(result).not.toHaveProperty('role_id')
  })

  test('single-column FK passes value through unchanged', () => {
    const fkSelectorValue = { user_id: '123' }
    const editedColumn = 'user_id'

    const result = filterForeignRowValue(fkSelectorValue, editedColumn)

    expect(result).toEqual({ user_id: '123' })
  })

  test('returns undefined when value is undefined', () => {
    const result = filterForeignRowValue(undefined, 'role_id')
    expect(result).toBeUndefined()
  })

  test('returns full value when editedColumn is undefined (fallback for Row Editor panel)', () => {
    const fkSelectorValue = { role_id: 'role-2', tenant_id: 'tenant-B' }

    const result = filterForeignRowValue(fkSelectorValue, undefined)

    // When no specific column is tracked, all values pass through (Row Editor case)
    expect(result).toEqual({ role_id: 'role-2', tenant_id: 'tenant-B' })
  })

  test('handles null value for the edited column', () => {
    const fkSelectorValue = { role_id: null, tenant_id: 'tenant-B' }
    const editedColumn = 'role_id'

    const result = filterForeignRowValue(fkSelectorValue, editedColumn)

    expect(result).toEqual({ role_id: null })
  })
})
