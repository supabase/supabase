import { type ResponseError } from '@/types'

export type QueryResult = {
  rows?: Record<string, unknown>[]
  error?: ResponseError
  autoLimit?: number
}
