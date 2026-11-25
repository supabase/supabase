import type { IncomingHttpHeaders } from 'node:http'
import { snakeCase } from 'lodash'
import type { NextApiRequest } from 'next'
import z from 'zod'

import { IS_PLATFORM, PG_META_URL } from '@/lib/constants'

/**
 * Construct headers for api request.
 * For platform, it will include apiKey into the provided headers.
 *
 * To prevent relay frontend request headers like useragent, referrer... into the middleware requests.
 * We will only keep the header keys that are in this list: Accept, Authorization, Content-Type, x-connection-encrypted
 */
export function constructHeaders(headers: { [prop: string]: any }) {
  if (headers) {
    const cleansedHeaders = {
      Accept: headers.Accept,
      Authorization: headers.Authorization,
      cookie: headers.cookie,
      'Content-Type': headers['Content-Type'],
      'x-connection-encrypted': headers['x-connection-encrypted'],
    } as any
    // clean up key with underfined value
    Object.keys(cleansedHeaders).forEach((key) =>
      cleansedHeaders[key] === undefined ? delete cleansedHeaders[key] : {}
    )
    return {
      ...cleansedHeaders,
      // [Joshen] JFYI both Alaister and I checked on this and realised this might not be used actually
      // Could be safe to remove but leaving it here for now
      ...(!IS_PLATFORM && { apiKey: `${process.env.SUPABASE_SERVICE_KEY}` }),
    }
  } else {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }
  }
}

// Typically for HTTP payloads
// @ts-ignore
export const toSnakeCase = (object) => {
  const snakeCaseObject = {}
  const snakeCaseArray = []

  if (!object) return null

  if (Array.isArray(object)) {
    for (const item of object) {
      if (typeof item === 'object') {
        snakeCaseArray.push(toSnakeCase(item))
      } else {
        snakeCaseArray.push(item)
      }
    }
    return snakeCaseArray
  } else if (typeof object === 'object') {
    for (const key of Object.keys(object)) {
      if (typeof object[key] === 'object') {
        // @ts-ignore
        snakeCaseObject[snakeCase(key)] = toSnakeCase(object[key])
      } else {
        // @ts-ignore
        snakeCaseObject[snakeCase(key)] = object[key]
      }
    }
    return snakeCaseObject
  } else {
    return object
  }
}

/**
 * Converts Node.js `IncomingHttpHeaders` to Fetch API `Headers`.
 */
export function fromNodeHeaders(nodeHeaders: IncomingHttpHeaders): Headers {
  const headers = new Headers()
  for (const [key, value] of Object.entries(nodeHeaders)) {
    if (Array.isArray(value)) {
      value.forEach((v) => headers.append(key, v))
    } else if (value !== undefined) {
      headers.append(key, value)
    }
  }
  return headers
}

/**
 * Zod transformer to parse boolean values from strings.
 *
 * Use when accepting a boolean value in a query parameter.
 */
export function zBooleanString(errorMsg?: string) {
  return z.string().transform((value, ctx) => {
    if (value === 'true') {
      return true
    }

    if (value === 'false') {
      return false
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: errorMsg || 'must be a boolean string',
    })
    return z.NEVER
  })
}

/**
 * Transform a comma-separated string into an array of strings.
 *
 * Use when accepting a list of values in a query parameter.
 */
export function commaSeparatedStringIntoArray(value: string): string[] {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

const BEARER_SCHEME = 'bearer'

/**
 * Extract the token from a `Bearer <token>` Authorization header (scheme is case-insensitive).
 *
 * Returns `null` for a missing, array-valued, non-Bearer or empty header. Parsed without a regex
 * over the token so untrusted input can't trigger backtracking.
 */
export function getBearerToken(authorization: string | string[] | undefined | null) {
  if (typeof authorization !== 'string') return null

  const scheme = authorization.slice(0, BEARER_SCHEME.length)
  const rest = authorization.slice(BEARER_SCHEME.length)
  if (scheme.toLowerCase() !== BEARER_SCHEME || !/^\s/.test(rest)) return null

  return rest.trim() || null
}

export class InternalServerError extends Error {
  constructor(
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'InternalServerError'
  }
}

/**
 * Construct the pgMeta redirection url passing along the filtering query params
 * @param req
 * @param endpoint
 */
export function getPgMetaRedirectUrl(req: NextApiRequest, endpoint: string) {
  const query = Object.entries(req.query).reduce((query, entry) => {
    const [key, value] = entry
    if (Array.isArray(value)) {
      for (const v of value) {
        query.append(key, v)
      }
    } else if (value) {
      query.set(key, value)
    }
    return query
  }, new URLSearchParams())

  let url = `${PG_META_URL}/${endpoint}`
  if (Object.keys(req.query).length > 0) {
    url += `?${query}`
  }
  return url
}
