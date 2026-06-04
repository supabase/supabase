import { describe, expect, it } from 'vitest'

import { mergeSql } from './merge-sql'

function merge(files: Array<{ templateId: string; content: string }>) {
  return mergeSql({ path: 'schema.sql', files })
}

describe('mergeSql', () => {
  it('keeps tables in different schemas as distinct objects', () => {
    const result = merge([
      { templateId: 'a', content: 'create table public.users (id int);' },
      { templateId: 'b', content: 'create table auth.users (id int);' },
    ])

    expect(result.warnings).toEqual([])
    expect(result.content).toContain('public.users')
    expect(result.content).toContain('auth.users')
  })

  it('deduplicates schema-qualified table collisions with a warning', () => {
    const result = merge([
      { templateId: 'a', content: 'create table public.todos (id int);' },
      { templateId: 'b', content: 'create table public.todos (id int, title text);' },
    ])

    expect(result.warnings).toContain('Duplicate table "public.todos" from b')
    expect(result.content.match(/create table public\.todos/g)).toHaveLength(1)
  })

  it('silently skips IF NOT EXISTS duplicates', () => {
    const result = merge([
      { templateId: 'a', content: 'create table if not exists public.todos (id int);' },
      { templateId: 'b', content: 'create table if not exists public.todos (id int);' },
    ])

    expect(result.warnings).toEqual([])
    expect(result.content.match(/create table if not exists public\.todos/g)).toHaveLength(1)
  })

  it('silently skips OR REPLACE function duplicates', () => {
    const result = merge([
      {
        templateId: 'a',
        content:
          'create or replace function add_one(x int) returns int as $$ select x + 1; $$ language sql;',
      },
      {
        templateId: 'b',
        content:
          'create or replace function add_one(x int) returns int as $$ select x + 2; $$ language sql;',
      },
    ])

    expect(result.warnings).toEqual([])
  })

  it('warns on function duplicates without OR REPLACE', () => {
    const result = merge([
      {
        templateId: 'a',
        content: 'create function add_one(x int) returns int as $$ select x + 1; $$ language sql;',
      },
      {
        templateId: 'b',
        content: 'create function add_one(x int) returns int as $$ select x + 1; $$ language sql;',
      },
    ])

    expect(result.warnings).toContain('Duplicate function "public.add_one" from b')
  })

  it('always warns on duplicate policies', () => {
    const result = merge([
      {
        templateId: 'a',
        content: 'create policy "read_own" on public.todos for select using (true);',
      },
      {
        templateId: 'b',
        content: 'create policy "read_own" on public.todos for select using (false);',
      },
    ])

    expect(result.warnings.some((w) => w.includes('Duplicate policy'))).toBe(true)
  })

  it('preserves statements with semicolons in $$ bodies', () => {
    const result = merge([
      {
        templateId: 'a',
        content: `create function multi() returns void as $$
begin
  perform 1;
  perform 2;
end;
$$ language plpgsql;`,
      },
    ])

    expect(result.content).toContain('perform 1;')
    expect(result.content).toContain('perform 2;')
  })

  it('passes through unrecognized statements (selects, inserts) unchanged', () => {
    const result = merge([
      { templateId: 'a', content: 'select 1;' },
      { templateId: 'b', content: "insert into foo values ('x');" },
    ])

    expect(result.content).toContain('select 1;')
    expect(result.content).toContain('insert into foo')
    expect(result.warnings).toEqual([])
  })

  it('does not break when a comment contains $$', () => {
    const result = merge([
      {
        templateId: 'a',
        content: `-- this comment mentions $$ dollar quoting
create table public.foo (id int);
create table public.bar (id int);`,
      },
    ])

    expect(result.content).toContain('public.foo')
    expect(result.content).toContain('public.bar')
  })
})
