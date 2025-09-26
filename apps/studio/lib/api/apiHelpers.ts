import { IS_PLATFORM } from 'lib/constants'
import { snakeCase } from 'lodash'
import type { IncomingHttpHeaders } from 'node:http'
import z from 'zod'

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
      ...(IS_PLATFORM
        ? { apiKey: `${process.env.READ_ONLY_API_KEY}` }
        : { apiKey: `${process.env.SUPABASE_SERVICE_KEY}` }),
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
