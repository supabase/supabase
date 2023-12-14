import { type paths } from '~/types/api'
import createClient from 'openapi-fetch'
import { v4 as uuidv4 } from 'uuid'
import { API_URL, LOCAL_SUPABASE } from './constants'
import { getAccessToken } from './userAuth'

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
}

const { GET: _get, POST: _post } = createClient<paths>({
  baseUrl: API_URL,
  referrerPolicy: 'no-referrer-when-downgrade',
  headers: DEFAULT_HEADERS,
})

export async function constructHeaders(headersInit?: HeadersInit | undefined) {
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

export const get: typeof _get = async (url, init) => {
  const headers = await constructHeaders(init?.headers)

  // on self-hosted, we don't have a /platform prefix
  if (LOCAL_SUPABASE && url.startsWith('/platform')) {
    // @ts-ignore
    url = url.replace('/platform', '')
  }

  return await _get(url, {
    ...init,
    headers,
  })
}

export const post: typeof _post = async (url, init) => {
  const headers = await constructHeaders(init?.headers)

  // on self-hosted, we don't have a /platform prefix
  if (LOCAL_SUPABASE && url.startsWith('/platform')) {
    // @ts-ignore
    url = url.replace('/platform', '')
  }

  return await _post(url, {
    ...init,
    headers,
  })
}
