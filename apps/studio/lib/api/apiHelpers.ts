import { camelCase, snakeCase } from 'lodash'
import { IS_PLATFORM } from 'lib/constants'

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

// Typically for HTTP response bodies
// @ts-ignore
export const toCamelCase = (object, whitelist = []) => {
  const camelCaseObject: any = {}
  const camelCaseArray: any[] = []

  if (!object) return null

  if (Array.isArray(object)) {
    for (const item of object) {
      if (typeof item === 'object') {
        camelCaseArray.push(toCamelCase(item))
      } else {
        camelCaseArray.push(item)
      }
    }
    return camelCaseArray
  } else if (typeof object === 'object') {
    for (const key of Object.keys(object)) {
      // @ts-ignore
      if (whitelist.length > 0 && whitelist.indexOf(key) >= 0) {
        // @ts-ignore
        snakeCaseObject[key] = value
      } else if (typeof object[key] === 'object') {
        camelCaseObject[camelCase(key)] = toCamelCase(object[key])
      } else {
        camelCaseObject[camelCase(key)] = object[key]
      }
    }
    return camelCaseObject
  } else {
    return object
  }
}

/**
 * Moves all Namespaced variables to the root
 *
 * @example
 * flattenNamespaceOnUser('https://supabase.io', { email: "copple@supabase.io", "https://supabase.io": { username: 'copple' } })
 * //=>
 * { email: "copple@supabase.io", username: 'copple' })
 */
export const flattenNamespaceOnUser = (
  NAMESPACE: string,
  user: {
    [prop: string]: any
  }
) => {
  let res = { ...user }
  Object.entries(user[NAMESPACE]).forEach(([k, v]) => {
    res[k] = v
  })
  return res
}
