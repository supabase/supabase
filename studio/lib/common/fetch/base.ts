import { tryParseJson } from 'lib/helpers'
import { isUndefined } from 'lodash'
import { SupaResponse } from 'types/base'

export function handleError<T>(e: any, requestId: string): SupaResponse<T> {
  const message = e?.message ? `An error has occured: ${e.message}` : 'An error has occured'
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
    const message = resTxt ?? `An error has occured: ${response.status}`
    const error = { code: response.status, message, requestId }
    return { error } as unknown as SupaResponse<T>
  }
}

export function getAccessToken() {
  // ignore if server-side
  if (typeof window === 'undefined') return ''

  const tokenData = window?.localStorage['supabase.auth.token']
  if (!tokenData) {
    // try to get from url fragment
    const access_token = getParameterByName('access_token')
    if (access_token) return access_token
    else return undefined
  }
  const tokenObj = tryParseJson(tokenData)
  if (tokenObj === false) {
    return ''
  }
  return tokenObj.currentSession.access_token
}

// get param from URL fragment
export function getParameterByName(name: string, url?: string) {
  // ignore if server-side
  if (typeof window === 'undefined') return ''

  if (!url) url = window?.location?.href || ''
  // eslint-disable-next-line no-useless-escape
  name = name.replace(/[\[\]]/g, '\\$&')
  const regex = new RegExp('[?&#]' + name + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(url)
  if (!results) return null
  if (!results[2]) return ''
  return decodeURIComponent(results[2].replace(/\+/g, ' '))
}

export function constructHeaders(requestId: string, optionHeaders?: { [prop: string]: any }) {
  let headers: { [prop: string]: any } = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Request-Id': requestId,
    ...optionHeaders,
  }

  const hasAuthHeader = !isUndefined(optionHeaders) && 'Authorization' in optionHeaders
  if (!hasAuthHeader) {
    const accessToken = getAccessToken()
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  }

  return headers
}
