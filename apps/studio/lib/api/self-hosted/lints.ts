import { enrichLintsQuery, getLintsSQL } from '@supabase/pg-meta'
import { paths } from 'api-types'

import { executeQuery } from './query'
import { DOCS_URL } from '@/lib/constants'

interface GetLintsOptions {
  headers?: HeadersInit
  exposedSchemas?: string
}

export async function getLints({ headers, exposedSchemas }: GetLintsOptions) {
  const sql = getLintsSQL({ docsUrl: DOCS_URL })
  return await executeQuery<ResponseData[number]>({
    query: enrichLintsQuery(sql, exposedSchemas),
    headers,
  })
}

export type ResponseData =
  paths['/platform/projects/{ref}/run-lints']['get']['responses']['200']['content']['application/json']
