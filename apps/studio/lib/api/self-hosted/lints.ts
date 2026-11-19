import { enrichLintsQuery, getLintsSQL } from '@supabase/pg-meta'
import { paths } from 'api-types'

import { executeQuery } from './query'
import { isSparkProject } from './spark'
import { DOCS_URL } from '@/lib/constants'

interface GetLintsOptions {
  headers?: HeadersInit
  exposedSchemas?: string
}

export async function getLints({ headers, exposedSchemas }: GetLintsOptions) {
  // TEMPORARY: Spark cannot run the lint SQL (pg_stat_statements, plpgsql); no lints until it can.
  if (isSparkProject()) return { data: [] as ResponseData, error: undefined }
  const sql = getLintsSQL({ docsUrl: DOCS_URL })
  return await executeQuery<ResponseData[number]>({
    query: enrichLintsQuery(sql, exposedSchemas),
    headers,
  })
}

export type ResponseData =
  paths['/platform/projects/{ref}/run-lints']['get']['responses']['200']['content']['application/json']
