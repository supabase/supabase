import { auth } from 'lib/gotrue'
import { isUndefined } from 'lodash'
import { SupaResponse } from 'types/base'

export function handleError<T>(e: any, requestId: string): SupaResponse<T> {
  const message = e?.message ? `An error has occurred: ${e.message}` : 'An error has occurred'
  const error = { code: 500, message, requestId }
  return { error } as unknown as SupaResponse<T>
}

export async function handleResponse<T>(
  response: Response,
  requestId: string
): Promise<SupaResponse<T>> {
  try {
    const resTxt = await response.text()
    try {
      // try to parse response text as json
      return JSON.parse(resTxt)
    } catch (err) {
      // return as text plain
      return resTxt as any
    }
  } catch (e) {
    return handleError(response, requestId) as SupaResponse<T>
  }
}

export async function handleHeadResponse<T>(
  response: Response,
  requestId: string,
  headers: string[]
): Promise<SupaResponse<T>> {
  try {
    const res = {} as any
    headers.forEach((header: string) => {
      res[header] = response.headers.get(header)
    })
    return res
  } catch (e) {
    return handleError(response, requestId) as SupaResponse<T>
  }
}

export async function handleResponseError<T = unknown>(
  response: Response,
  requestId: string
): Promise<SupaResponse<T>> {
  let resJson: { [prop: string]: any }

  const resTxt = await response.text()
  try {
    resJson = JSON.parse(resTxt)
  } catch (_) {
    resJson = {}
  }

  if (resJson.error && typeof resJson.error === 'string') {
    if (resJson.error_description) {
      const error = {
        code: response.status,
        message: resJson.error,
        description: resJson.error_description,
        requestId,
      }
      return { error } as unknown as SupaResponse<T>
    } else {
      const error = { code: response.status, message: resJson.error, requestId }
      return { error } as unknown as SupaResponse<T>
    }
  } else if (resJson.message) {
    const error = { code: response.status, message: resJson.message, requestId }
    return { error } as unknown as SupaResponse<T>
  } else if (resJson.msg) {
    const error = { code: response.status, message: resJson.msg, requestId }
    return { error } as unknown as SupaResponse<T>
  } else if (resJson.error && resJson.error.message) {
    return { error: { code: response.status, ...resJson.error } } as unknown as SupaResponse<T>
  } else {
    const message = resTxt ?? `An error has occurred: ${response.status}`
    const error = { code: response.status, message, requestId }
    return { error } as unknown as SupaResponse<T>
  }
}

export async function getAccessToken() {
  // ignore if server-side
  if (typeof window === 'undefined') return ''

  const {
    data: { session },
  } = await auth.getSession()

  return session?.access_token
}

export async function constructHeaders(requestId: string, optionHeaders?: { [prop: string]: any }) {
  let headers: { [prop: string]: any } = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Request-Id': requestId,
    ...optionHeaders,
  }

  const hasAuthHeader = !isUndefined(optionHeaders) && 'Authorization' in optionHeaders
  if (!hasAuthHeader) {
    const accessToken = await getAccessToken()
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  }

  if (typeof window !== 'undefined') {
    const gaClientId = window?.localStorage?.getItem('ga_client_id')
    if (gaClientId && gaClientId !== 'undefined') headers['X-GA-Client-Id'] = gaClientId
  }

  return headers
}
