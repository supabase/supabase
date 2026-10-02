export interface Persistence {
  insertBatch<T extends object>(table: string, records: T[]): Promise<void>
  beginTransaction(): Promise<void>
  commitTransaction(): Promise<void>
  rollbackTransaction(): Promise<void>
  rawQuery(query: string, bindings?: object[]): Promise<object>
}
