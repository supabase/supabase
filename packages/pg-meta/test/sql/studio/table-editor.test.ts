import { afterAll, expect, test } from 'vitest'

import { getTableEditorSql } from '../../../src'
import { cleanupRoot, createTestDatabase } from '../../db/utils'

afterAll(async () => {
  await cleanupRoot()
})

type Entity = {
  entity_type: string
  id: number
  schema: string
  name: string
  primary_keys: Array<{ table_id: number; schema: string; table_name: string; name: string }>
  unique_indexes: Array<{ table_id: number; schema: string; table_name: string; columns: string[] }>
  relationships: Array<{
    id: number
    constraint_name: string
    source_schema: string
    source_table_name: string
    source_column_name: string
    target_table_schema: string
    target_table_name: string
    target_column_name: string
  }>
  columns: Array<{
    name: string
    is_unique: boolean
    check: string | null
    comment: string | null
  }>
}

const withTestDatabase = (
  name: string,
  fn: (db: Awaited<ReturnType<typeof createTestDatabase>>) => Promise<void>
) => {
  test(name, async () => {
    const db = await createTestDatabase()
    try {
      await fn(db)
    } finally {
      await db.cleanup()
    }
  })
}

// The `scoped` flag gates the PR #47894 scoping predicates (default OFF for
// progressive rollout). Both code paths must return semantically identical
// entities; running the same assertions for scoped:true and scoped:false is the
// CI equivalence guard. Once the rollout completes, drop scoped:false here.
for (const scoped of [true, false]) {
  withTestDatabase(
    `scopes primary keys, unique indexes, relationships and columns to the target table (scoped=${scoped})`,
    async ({ executeQuery }) => {
      await executeQuery(`
      create schema if not exists editor_scope;

      create table editor_scope.authors (
        id serial primary key
      );

      create table editor_scope.books (
        id serial primary key,
        isbn text not null unique,
        price numeric not null check (price > 0),
        author_id int not null references editor_scope.authors (id)
      );
      comment on column editor_scope.books.isbn is 'International Standard Book Number';

      create table editor_scope.reviews (
        id serial primary key,
        book_id int not null references editor_scope.books (id)
      );
    `)

      const [{ id: booksId }] = await executeQuery<{ id: number }[]>(
        `select 'editor_scope.books'::regclass::oid::int8 as id;`
      )

      const sql = getTableEditorSql({ id: booksId, scoped })
      const [{ entity }] = await executeQuery<{ entity: Entity }[]>(sql)

      // Basic identity.
      expect(entity.id).toBe(booksId)
      expect(entity.schema).toBe('editor_scope')
      expect(entity.name).toBe('books')

      // Primary key scoped to `books`.
      expect(entity.primary_keys).toEqual([
        { schema: 'editor_scope', table_name: 'books', table_id: booksId, name: 'id' },
      ])

      // Unique index scoped to `books`.
      expect(entity.unique_indexes).toHaveLength(1)
      expect(entity.unique_indexes[0]).toMatchObject({
        schema: 'editor_scope',
        table_name: 'books',
        table_id: booksId,
        columns: ['isbn'],
      })

      // Relationships include both the outgoing FK (books -> authors) and the
      // incoming FK (reviews -> books).
      expect(entity.relationships).toContainEqual(
        expect.objectContaining({
          source_table_name: 'books',
          source_column_name: 'author_id',
          target_table_name: 'authors',
          target_column_name: 'id',
        })
      )
      expect(entity.relationships).toContainEqual(
        expect.objectContaining({
          source_table_name: 'reviews',
          source_column_name: 'book_id',
          target_table_name: 'books',
          target_column_name: 'id',
        })
      )

      // Columns: unique flag, check constraint definition, and comment.
      const isbnCol = entity.columns.find((c) => c.name === 'isbn')!
      expect(isbnCol.is_unique).toBe(true)
      expect(isbnCol.comment).toBe('International Standard Book Number')

      const priceCol = entity.columns.find((c) => c.name === 'price')!
      expect(priceCol.check).toContain('price > 0')
    }
  )
}
