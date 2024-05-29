import { ParseResult } from './types'

declare module 'libpg-query' {
  export * from './types'
  export function parseQuery(sql: string): Promise<ParseResult>
}
