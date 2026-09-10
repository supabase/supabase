import { describe, expect, it } from 'vitest'

import { isSqlStatement } from './ExplorerHomeTab.utils'

describe('isSqlStatement', () => {
  it.each([
    'select * from profiles',
    'SELECT id FROM profiles WHERE id = 1;',
    "insert into logs (msg) values ('hi')",
    'update profiles set name = null',
    'delete from profiles where id = 1',
    'with recent as (select 1) select * from recent',
    '  \n  select 1',
    '-- get everyone\nselect * from profiles',
  ])('returns true for %s', (message) => {
    expect(isSqlStatement(message)).toBe(true)
  })

  it.each([
    '',
    '   ',
    'How do I add a new column to my table?',
    'What indexes exist on my users table?',
    'Explain how RLS works',
    'Can you help me select the right plan for my project?',
  ])('returns false for %s', (message) => {
    expect(isSqlStatement(message)).toBe(false)
  })
})
