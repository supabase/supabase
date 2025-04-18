import type { paths } from 'api-types'
import createClient from 'openapi-fetch'
import { v4 as uuidv4 } from 'uuid'

import { API_URL } from '../constants'
import { getAccessToken } from '../userAuth'

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
}

const client = createClient<paths>({
  baseUrl: API_URL,
  referrerPolicy: 'no-referrer-when-downgrade',
  headers: DEFAULT_HEADERS,
})

async function constructHeaders(headersInit?: HeadersInit | undefined) {
  const requestId = uuidv4()
  const headers = new Headers(headersInit)

  headers.set('X-Request-Id', requestId)

  if (!headers.has('Authorization')) {
    const accessToken = await getAccessToken()
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
    }
  }

  return headers
}

client.use({
  async onRequest({ request }) {
    const headers = await constructHeaders(request.headers)
    headers.forEach((value, key) => {
      request.headers.set(key, value)
    })

    return request
  },
})

export const { GET: get, POST: post } = client
