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
    'create table users (id serial primary key)',
    'CREATE OR REPLACE FUNCTION foo() RETURNS void AS $$ BEGIN END; $$ LANGUAGE plpgsql',
    'create policy my_policy on profiles for select using (true)',
    'show search_path',
    'SHOW ALL;',
    'set search_path to public',
    "SET TIME ZONE 'UTC'",
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
    'Create a new table for storing user profiles',
    'Show me my tables',
    'Set up RLS on my users table',
    'With my current schema, what tables should I add?',
  ])('returns false for %s', (message) => {
    expect(isSqlStatement(message)).toBe(false)
  })
})
