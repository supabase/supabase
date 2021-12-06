import { handleError, handleResponse, handleResponseError, getAccessToken } from './base'
import { uuidv4 } from '../../helpers'
import { SupaResponse } from 'types/base'

export async function delete_<T = any>(
  url: string,
  data?: { [prop: string]: any },
  options?: { [prop: string]: any }
): Promise<SupaResponse<T>> {
  const requestId = uuidv4()
  const { headers, ...otherOptions } = options ?? {}
  const accessToken = getAccessToken()
  try {
    const response = await fetch(url, {
      method: 'DELETE',
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
