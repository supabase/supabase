import { handleError, handleHeadResponse, handleResponseError, constructHeaders } from './base'
import { uuidv4 } from '../../helpers'
import { SupaResponse } from 'types/base'

/**
 * @deprecated please use head method from data/fetchers instead
 */
export async function head<T = any>(
  url: string,
  headersToRetrieve: string[],
  options?: { [prop: string]: any }
): Promise<SupaResponse<T>> {
  const requestId = uuidv4()
  try {
    const { headers: optionHeaders, ...otherOptions } = options ?? {}
    const headers = await constructHeaders(requestId, optionHeaders)
    const response = await fetch(url, {
      method: 'HEAD',
      referrerPolicy: 'no-referrer-when-downgrade',
      headers,
      ...otherOptions,
    })
    if (!response.ok) return handleResponseError(response, requestId)
    return handleHeadResponse(response, requestId, headersToRetrieve)
  } catch (error) {
    return handleError(error, requestId)
  }
}

export async function headWithTimeout<T = any>(
  url: string,
  headersToRetrieve: string[],
  options?: { [prop: string]: any }
): Promise<SupaResponse<T>> {
  const requestId = uuidv4()
  try {
    const timeout = options?.timeout ?? 60000
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    const { headers: optionHeaders, ...otherOptions } = options ?? {}
    const headers = await constructHeaders(requestId, optionHeaders)
    const response = await fetch(url, {
      method: 'HEAD',
      referrerPolicy: 'no-referrer-when-downgrade',
      headers,
      ...otherOptions,
      signal: controller.signal,
    })
    clearTimeout(id)

    if (!response.ok) return handleResponseError(response, requestId)
    return handleHeadResponse(response, requestId, headersToRetrieve)
  } catch (error) {
    return handleError(error, requestId)
  }
}
