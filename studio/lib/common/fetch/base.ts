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

export async function handleResponseError<T = unknown>(
  response: Response,
  requestId: string
): Promise<SupaResponse<T>> {
  let resJson: { [prop: string]: any }
  try {
    resJson = await response.json()
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
  } else if (resJson.msg) {
    const error = { code: response.status, message: resJson.msg, requestId }
    return { error } as unknown as SupaResponse<T>
  } else if (resJson.error && resJson.error.message) {
    return { error: { code: response.status, ...resJson.error } } as unknown as SupaResponse<T>
  } else if (response.statusText) {
    const error = { code: response.status, message: response.statusText, requestId }
    return { error } as unknown as SupaResponse<T>
  } else {
    const message = `An error has occured: ${response.status}`
    const error = { code: response.status, message, requestId }
    return { error } as unknown as SupaResponse<T>
  }
}
