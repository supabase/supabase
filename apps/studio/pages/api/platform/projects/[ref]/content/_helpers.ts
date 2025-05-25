import { constructHeaders } from 'lib/api/apiHelpers'
import { post } from 'lib/common/fetch'
import { PG_META_URL } from 'lib/constants'

export const query = async (query: string, requestHeaders: { [prop: string]: any } = {}) => {
  const headers = constructHeaders(requestHeaders)
  return await post(`${PG_META_URL}/query`, { query }, { headers })
}
