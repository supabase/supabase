import type { DatabaseFunctionsData } from '@/data/database-functions/database-functions-query'
import type { Schema } from '@/data/database/schemas-query'
import type { TableColumn } from '@/data/database/table-columns-query'

// Table/schema/keyword/function metadata for SQL IntelliSense, held in a ref (see
// useAddDefinitions.ts) so Monaco's completion/signature-help providers can read the latest
// value without re-registering on every fetch.
export type PgInfo = {
  keywords: string[]
  schemas: Schema[]
  functions: DatabaseFunctionsData
  tableColumns: TableColumn[]
}
