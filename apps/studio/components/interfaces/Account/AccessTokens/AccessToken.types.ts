export const ACCESS_TOKEN_SORT_VALUES = [
  'created_at:asc',
  'created_at:desc',
  'last_used_at:asc',
  'last_used_at:desc',
  'expires_at:asc',
  'expires_at:desc',
] as const

export type AccessTokenSort = (typeof ACCESS_TOKEN_SORT_VALUES)[number]
export type AccessTokenSortColumn = AccessTokenSort extends `${infer Column}:${string}`
  ? Column
  : never
export type AccessTokenSortOrder = AccessTokenSort extends `${string}:${infer Order}`
  ? Order
  : never

export interface BaseToken {
  id: string | number
  name: string
  token_alias: string
  created_at: string
  last_used_at?: string | null
  expires_at?: string | null
}
