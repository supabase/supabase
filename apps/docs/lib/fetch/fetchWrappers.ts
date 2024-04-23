import { type paths } from '~/types/api'
import createClient from 'openapi-fetch'
import { v4 as uuidv4 } from 'uuid'
import { API_URL } from '../constants'
import { getAccessToken } from '../userAuth'

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
}

const { GET: _get, POST: _post } = createClient<paths>({
  baseUrl: API_URL,
  referrerPolicy: 'no-referrer-when-downgrade',
  headers: DEFAULT_HEADERS,
})

export async function constructHeaders(
  headersInit?: HeadersInit | undefined,
  { allowUnauthenticated = false }: { allowUnauthenticated?: boolean } = {}
) {
  const requestId = uuidv4()
  const headers = new Headers(headersInit)

  headers.set('X-Request-Id', requestId)

  if (!headers.has('Authorization')) {
    const accessToken = await getAccessToken()
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
    } else if (!allowUnauthenticated) {
      throw Error("can't fetch authenticated routes without signing in")
    }
  }

  return headers
}

/**
 * [Charis] A bunch of ts-ignore here because there's something going on with
 * the type inference, where I can't get it to both:
 *
 * - Be happy with the passed init argument
 * - Properly infer the types of the fetch params and responses, as intended
 *
 * Inferring the types of fetch responses seemed far more useful for DX, so I
 * forced it to accept the init functions in order to preserve that.
 */

// @ts-ignore
export const get: typeof _get = async (url, init) => {
  const headers = await constructHeaders(init?.headers)

  // @ts-ignore
  return await _get(url, {
    ...init,
    headers,
  })
}

// @ts-ignore
export const post: typeof _post = async (url, init) => {
  const headers = await constructHeaders(init?.headers)

  // @ts-ignore
  return await _post(url, {
    ...init,
    headers,
  })
}

// @ts-ignore
export const unauthedAllowedPost: typeof _post = async (url, init) => {
  const headers = await constructHeaders(init?.headers, { allowUnauthenticated: true })

  // @ts-ignore
  return await _post(url, {
    ...init,
    headers,
  })
}
