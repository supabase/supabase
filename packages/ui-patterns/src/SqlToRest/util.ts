import type { HttpRequest, Statement, SupabaseJsQuery } from '@supabase/sql-to-rest'

export type BaseResult = {
  statement: Statement
}

export type HttpResult = BaseResult &
  HttpRequest & {
    type: 'http'
    language: 'http' | 'curl'
  }

export type SupabaseJsResult = BaseResult &
  SupabaseJsQuery & {
    type: 'supabase-js'
    language: 'js'
  }

export type ResultBundle = HttpResult | SupabaseJsResult
