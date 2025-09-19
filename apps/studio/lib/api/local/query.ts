import { fetchPost } from 'data/fetchers'
import { PG_META_URL } from 'lib/constants/index'
import type { IncomingHttpHeaders } from 'node:http'

export type QueryOptions = {
  query: string
  headers?: IncomingHttpHeaders
}

export async function executeQuery({ query, headers }: QueryOptions) {
  return await fetchPost(`${PG_META_URL}/query`, { query }, { headers })
}
