import * as Sentry from '@sentry/nextjs'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import { getAccessToken } from 'lib/gotrue'
import { uuidv4 } from 'lib/helpers'
import createClient from 'openapi-fetch'
import type { paths } from './api' // generated from openapi-typescript

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
}

// This file will eventually replace what we currently have in lib/fetchWrapper, but will be currently unused until we get to that refactor

const {
  get: _get,
  post: _post,
  put: _put,
  patch: _patch,
  del: _del,
  head: _head,
  trace: _trace,
  options: _options,
} = createClient<paths>({
  // [Joshen] Just FYI, the replace is temporary until we update env vars API_URL to remove /platform or /v1 - should just be the base URL
  baseUrl: API_URL?.replace('/platform', ''),
  referrerPolicy: 'no-referrer-when-downgrade',
  headers: DEFAULT_HEADERS,
})

export async function constructHeaders(headersInit?: HeadersInit | undefined) {
  const requestId = uuidv4()
  const headers = new Headers(headersInit)

  headers.set('X-Request-Id', requestId)

  if (!headers.has('Authorization')) {
    const accessToken = await getAccessToken()
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  }

  return headers
}

export const get: typeof _get = async (url, init) => {
  const headers = await constructHeaders(init?.headers)

  // on self-hosted, we don't have a /platform prefix
  if (!IS_PLATFORM && url.startsWith('/platform')) {
    // @ts-ignore
    url = url.replace('/platform', '')
  }

  return await _get(url, {
    credentials: 'include',
    ...init,
    headers,
  })
}

export const post: typeof _post = async (url, init) => {
  const headers = await constructHeaders(init?.headers)

  // on self-hosted, we don't have a /platform prefix
  if (!IS_PLATFORM && url.startsWith('/platform')) {
    // @ts-ignore
    url = url.replace('/platform', '')
  }

  return await _post(url, {
    credentials: 'include',
    ...init,
    headers,
  })
}

export const put: typeof _put = async (url, init) => {
  const headers = await constructHeaders(init?.headers)

  // on self-hosted, we don't have a /platform prefix
  if (!IS_PLATFORM && url.startsWith('/platform')) {
    // @ts-ignore
    url = url.replace('/platform', '')
  }

  return await _put(url, {
    credentials: 'include',
    ...init,
    headers,
  })
}

export const patch: typeof _patch = async (url, init) => {
  const headers = await constructHeaders(init?.headers)

  // on self-hosted, we don't have a /platform prefix
  if (!IS_PLATFORM && url.startsWith('/platform')) {
    // @ts-ignore
    url = url.replace('/platform', '')
  }

  return await _patch(url, {
    credentials: 'include',
    ...init,
    headers,
  })
}

export const del: typeof _del = async (url, init) => {
  const headers = await constructHeaders(init?.headers)

  // on self-hosted, we don't have a /platform prefix
  if (!IS_PLATFORM && url.startsWith('/platform')) {
    // @ts-ignore
    url = url.replace('/platform', '')
  }

  return await _del(url, {
    credentials: 'include',
    ...init,
    headers,
  })
}

export const head: typeof _head = async (url, init) => {
  const headers = await constructHeaders(init?.headers)

  // on self-hosted, we don't have a /platform prefix
  if (!IS_PLATFORM && url.startsWith('/platform')) {
    // @ts-ignore
    url = url.replace('/platform', '')
  }

  return await _head(url, {
    credentials: 'include',
    ...init,
    headers,
  })
}

export const trace: typeof _trace = async (url, init) => {
  const headers = await constructHeaders(init?.headers)

  return await _trace(url, {
    credentials: 'include',
    ...init,
    headers,
  })
}

export const options: typeof _options = async (url, init) => {
  const headers = await constructHeaders(init?.headers)

  return await _options(url, {
    credentials: 'include',
    ...init,
    headers,
  })
}

export const handleError = (error: any): never => {
  if (error && typeof error.msg === 'string') {
    throw new Error(error.msg || 'API error happened while trying to communicate with the server.')
  }

  if (error && typeof error.message === 'string') {
    throw new Error(
      error.message || 'API error happened while trying to communicate with the server.'
    )
  }

  console.error(error.stack)
  // the error doesn't have a message or msg property, so we can't throw it as an error. Log it via Sentry so that we can
  // add handling for it.
  Sentry.captureException(error)

  // throw a generic error if we don't know what the error is. The message is intentionally vague because it might show
  // up in the UI.
  throw new Error('API error happened while trying to communicate with the server.')
}
