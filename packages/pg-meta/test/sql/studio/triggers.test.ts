import { describe, expect, test } from 'vitest'

import { getDatabaseTriggerUpdateSQL } from '../../../src'
import { keyword, safeSql } from '../../../src/pg-format'

const originalTrigger = {
  id: 1,
  table_id: 10,
  enabled_mode: 'ORIGIN' as const,
  name: 'audit_trigger',
  table: 'users',
  schema: 'public',
  condition: null,
  orientation: 'ROW' as const,
  activation: 'AFTER' as const,
  events: ['INSERT'],
  function_schema: 'public',
  function_name: 'audit_fn',
  function_args: [],
}

const baseUpdatedTrigger = {
  name: 'audit_trigger',
  schema: 'public',
  table: 'users',
  function_schema: 'public',
  function_name: 'audit_fn',
  function_args: [],
  activation: 'AFTER' as const,
  orientation: 'ROW' as const,
  enabled_mode: 'ORIGIN' as const,
  events: [keyword('INSERT')],
}

describe('getDatabaseTriggerUpdateSQL', () => {
  test('recreates a row-level trigger without a condition (existing behavior)', () => {
    const sql = getDatabaseTriggerUpdateSQL({
      originalTrigger,
      updatedTrigger: baseUpdatedTrigger,
    })

    expect(sql).toContain('DROP TRIGGER audit_trigger ON public.users;')
    expect(sql).toContain('FOR EACH ROW EXECUTE FUNCTION')
    expect(sql).not.toContain('WHEN')
  })

  test('honors an updated STATEMENT orientation instead of forcing FOR EACH ROW', () => {
    const sql = getDatabaseTriggerUpdateSQL({
      originalTrigger,
      updatedTrigger: { ...baseUpdatedTrigger, orientation: 'STATEMENT' as const },
    })

    expect(sql).toContain('FOR EACH STATEMENT EXECUTE FUNCTION')
    expect(sql).not.toContain('FOR EACH ROW')
  })

  test('preserves the original STATEMENT orientation when the update omits it', () => {
    const { orientation: _omitted, ...updatedWithoutOrientation } = baseUpdatedTrigger
    const sql = getDatabaseTriggerUpdateSQL({
      originalTrigger: { ...originalTrigger, orientation: 'STATEMENT' as const },
      updatedTrigger: updatedWithoutOrientation,
    })

    expect(sql).toContain('FOR EACH STATEMENT EXECUTE FUNCTION')
    expect(sql).not.toContain('FOR EACH ROW')
  })

  test('preserves an updated WHEN condition on the recreated trigger', () => {
    const sql = getDatabaseTriggerUpdateSQL({
      originalTrigger,
      updatedTrigger: {
        ...baseUpdatedTrigger,
        condition: safeSql`NEW.id > 0`,
      },
    })

    expect(sql).toContain('FOR EACH ROW WHEN (NEW.id > 0) EXECUTE FUNCTION')
  })

  test('renames the trigger while recreating it', () => {
    const sql = getDatabaseTriggerUpdateSQL({
      originalTrigger,
      updatedTrigger: { ...baseUpdatedTrigger, name: 'audit_trigger_v2' },
    })

    expect(sql).toContain('DROP TRIGGER audit_trigger ON public.users;')
    expect(sql).toContain('CREATE TRIGGER audit_trigger_v2 AFTER')
  })
})
