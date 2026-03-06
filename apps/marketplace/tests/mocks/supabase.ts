import { vi } from 'vitest'

type QueryResult<T> = {
  data: T
  error: null | { message: string; code?: string }
}

export function success<T>(data: T): QueryResult<T> {
  return { data, error: null }
}

export function failure(message: string, code?: string): QueryResult<null> {
  return { data: null, error: { message, code } }
}

export function createAuthMock(user: null | { id: string; email?: string }) {
  return {
    getUser: vi.fn().mockResolvedValue({ data: { user } }),
  }
}
