import type { SupaResponse } from 'types/base'
import { uuidv4 } from '../../helpers'
import { constructHeaders, handleError, handleResponse, handleResponseError } from './base'

/**
 * @deprecated Please use get method from data/fetchers instead, unless making requests to an external URL
 */
export async function get<T = any>(
  url: string,
  options?: { [prop: string]: any }
): Promise<SupaResponse<T>> {
  const requestId = uuidv4()
  try {
    const { headers: optionHeaders, ...otherOptions } = options ?? {}
    const headers = await constructHeaders(requestId, optionHeaders)
    const response = await fetch(url, {
      method: 'GET',
      referrerPolicy: 'no-referrer-when-downgrade',
      headers,
      ...otherOptions,
    })
    if (!response.ok) return handleResponseError(response, requestId)
    return handleResponse(response, requestId)
  } catch (error) {
    return handleError(error, requestId)
  }
}

export async function getWithTimeout<T = any>(
  url: string,
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
      method: 'GET',
      referrerPolicy: 'no-referrer-when-downgrade',
      headers,
      ...otherOptions,
      signal: controller.signal,
    })
    clearTimeout(id)

    if (!response.ok) return handleResponseError(response, requestId)
    return handleResponse(response, requestId)
  } catch (error) {
    return handleError(error, requestId)
  }
}
