import { constructHeaders } from 'lib/api/apiHelpers'
import { post } from 'lib/common/fetch'
import { PG_META_URL } from 'lib/constants'
import type { ResponseError } from 'types'

export async function queryPgMetaSelfHosted(sql: string, headersInit?: { [prop: string]: any }) {
  const headers = constructHeaders(headersInit ?? {})
  const response = await post(`${PG_META_URL}/query`, { query: sql }, { headers })

  if (response.error) {
    return { error: response.error as ResponseError }
  } else {
    return { data: response }
  }
}
