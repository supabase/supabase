import { fetchPost } from 'data/fetchers'
import { PG_META_URL } from 'lib/constants/index'
import { ResponseError } from 'types'
import { constructHeaders } from '../apiHelpers'

export type QueryOptions = {
  query: string
  headers?: HeadersInit
}

export async function executeQuery<T = unknown>({ query, headers }: QueryOptions) {
  const response = await fetchPost<T[]>(
    `${PG_META_URL}/query`,
    { query },
    { headers: constructHeaders(headers ?? {}) }
  )

  if (response instanceof ResponseError) {
    return { error: response }
  } else {
    return { data: response }
  }
}
