import * as Sentry from '@sentry/nextjs'
import { API_URL } from 'lib/constants'
import { getAccessToken } from 'lib/gotrue'
import { uuidv4 } from 'lib/helpers'
import createClient from 'openapi-fetch'
import { ResponseError } from 'types'
import type { paths } from './api' // generated from openapi-typescript

const DEFAULT_HEADERS = {
  Accept: 'application/json',
}

// This file will eventually replace what we currently have in lib/fetchWrapper, but will be currently unused until we get to that refactor

const client = createClient<paths>({
  // [Joshen] Just FYI, the replace is temporary until we update env vars API_URL to remove /platform or /v1 - should just be the base URL
  baseUrl: API_URL?.replace('/platform', ''),
  referrerPolicy: 'no-referrer-when-downgrade',
  headers: DEFAULT_HEADERS,
  credentials: 'include',
  querySerializer: {
    array: {
      style: 'form',
      explode: false,
    },
  },
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

// Middleware
client.use(
  {
    // Middleware to add authorization headers to the request
    async onRequest({ request }) {
      const headers = await constructHeaders()
      headers.forEach((value, key) => request.headers.set(key, value))

      return request
    },
  },
  {
    // Middleware to format errors
    async onResponse({ request, response }) {
      if (response.ok) {
        return response
      }

      // handle errors
      try {
        // attempt to parse the response body as JSON
        let body = await response.clone().json()

        // add code field to body
        body.code = response.status
        body.requestId = request.headers.get('X-Request-Id')

        return new Response(JSON.stringify(body), {
          headers: response.headers,
          status: response.status,
          statusText: response.statusText,
        })
      } catch {
        // noop
      }

      return response
    },
  }
)

export const {
  GET: get,
  POST: post,
  PUT: put,
  PATCH: patch,
  DELETE: del,
  HEAD: head,
  TRACE: trace,
  OPTIONS: options,
} = client

export const handleError = (error: unknown): never => {
  if (error && typeof error === 'object') {
    const errorMessage =
      'msg' in error && typeof error.msg === 'string'
        ? error.msg
        : 'message' in error && typeof error.message === 'string'
          ? error.message
          : undefined

    const errorCode = 'code' in error && typeof error.code === 'number' ? error.code : undefined
    const requestId =
      'requestId' in error && typeof error.requestId === 'string' ? error.requestId : undefined

    if (errorMessage) {
      throw new ResponseError(errorMessage, errorCode, requestId)
    }
  }

  if (error !== null && typeof error === 'object' && 'stack' in error) {
    console.error(error.stack)
  }

  // the error doesn't have a message or msg property, so we can't throw it as an error. Log it via Sentry so that we can
  // add handling for it.
  Sentry.captureException(error)

  // throw a generic error if we don't know what the error is. The message is intentionally vague because it might show
  // up in the UI.
  throw new ResponseError(undefined)
}
