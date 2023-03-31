import type { PostgresSchema } from '@supabase/postgres-meta'
import PostgresMetaInterface from '../common/PostgresMetaInterface'
import { IRootStore } from '../RootStore'

export default class SchemaStore extends PostgresMetaInterface<PostgresSchema> {
  constructor(
    rootStore: IRootStore,
    dataUrl: string,
    headers?: {
      [prop: string]: any
    },
    options?: { identifier: string }
  ) {
    super(rootStore, dataUrl, headers, options)
  }

  // Dashboard to hide schemas with pg_ prefix
  list(filter: any) {
    const schemasFilter = (schema: PostgresSchema) =>
      !schema.name.startsWith('pg_') && (typeof filter === 'function' ? filter(schema) : true)

    return super.list(schemasFilter)
  }
}
