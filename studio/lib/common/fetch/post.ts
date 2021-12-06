import { handleError, handleResponse, handleResponseError, getAccessToken } from './base'
import { uuidv4 } from 'lib/helpers'
import { SupaResponse } from 'types/base'

export async function post<T = any>(
  url: string,
  data: { [prop: string]: any },
  options?: { [prop: string]: any }
): Promise<SupaResponse<T>> {
  const requestId = uuidv4()
  try {
    const { headers, ...otherOptions } = options ?? {}
    const accessToken = getAccessToken()
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      credentials: 'include',
      referrerPolicy: 'no-referrer-when-downgrade',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Request-Id': requestId,
        'Authorization': `Bearer ${accessToken}`,
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
