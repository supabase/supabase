import { parse } from 'libpg-query'
import { describe, expect, it } from 'vitest'

import { getQueryLabel, getQueryRelations } from './query-relations'

const relationsIn = async (sql: string) => getQueryRelations(await parse(sql))

describe('getQueryRelations', () => {
  it('lists every relation a query touches once, in the order it is written', async () => {
    expect(
      await relationsIn(
        'select * from public.orders o join users u on u.id = o.user_id join public.orders x on true'
      )
    ).toEqual([
      { schema: 'public', name: 'orders' },
      { schema: null, name: 'users' },
    ])
  })

  it('includes the target of a write, not only the relations it reads', async () => {
    expect(await relationsIn('update public.users set name = n.name from names n')).toEqual([
      { schema: 'public', name: 'users' },
      { schema: null, name: 'names' },
    ])
  })

  it('leaves out CTE names, which are not database objects', async () => {
    expect(
      await relationsIn('with recent as (select * from public.orders) select * from recent')
    ).toEqual([{ schema: 'public', name: 'orders' }])
  })

  it('keeps a schema-qualified relation that shares its name with a CTE', async () => {
    expect(
      await relationsIn('with orders as (select 1) select * from orders, public.orders')
    ).toEqual([{ schema: 'public', name: 'orders' }])
  })
})

const labelFor = async (sql: string) => {
  const ast = await parse(sql)
  const [first] = ast.stmts ?? []
  return getQueryLabel({
    statementType: first?.stmt ? Object.keys(first.stmt)[0] : null,
    statementCount: ast.stmts?.length ?? 0,
    relations: getQueryRelations(ast),
  })
}

describe('getQueryLabel', () => {
  it.each([
    ['select * from public.places', 'Select from places'],
    [
      'select * from orders o join auth.users u on u.id = o.user_id',
      'Select from orders and auth.users',
    ],
    ['select * from a, b, c', 'Select from a and 2 others'],
    ["update public.orders set status = 'paid'", 'Update orders'],
    ['insert into todos (title) select title from drafts', 'Insert into todos'],
    ['delete from sessions where expires_at < now()', 'Delete from sessions'],
    ['create table todos (id bigint primary key)', 'Create table todos'],
    ['create view active_todos as select * from todos', 'Create view active_todos'],
    ['create policy "read" on todos for select using (true)', 'Create policy on todos'],
    ['alter table todos enable row level security', 'Alter todos'],
  ])('names %s as "%s", so a tab says what its query does', async (sql, label) => {
    expect(await labelFor(sql)).toBe(label)
  })

  it('counts the statements after the first, so a script is not mistaken for one query', async () => {
    expect(await labelFor('create table a (id int); create table b (id int); select 1')).toBe(
      'Create table a and 2 more statements'
    )
  })

  it('leaves statements it has no words for to the generic title', async () => {
    expect(await labelFor('listen channel_name')).toBeUndefined()
  })
})
