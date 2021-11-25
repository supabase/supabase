import { handleError, handleResponse, handleResponseError } from './base'
import { uuidv4 } from '../../helpers'
import { SupaResponse } from 'types/base'

export async function get<T = any>(
  url: string,
  options?: { [prop: string]: any }
): Promise<SupaResponse<T>> {
  const requestId = uuidv4()
  try {
    const { headers, ...otherOptions } = options ?? {}
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      referrerPolicy: 'no-referrer-when-downgrade',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Request-Id': requestId,
        ...headers,
      },
      ...otherOptions,
    })
    if (!response.ok) return handleResponseError(response, requestId)
    return handleResponse(response, requestId)
  } catch (error) {
    return handleError(error, requestId)
  }
}
