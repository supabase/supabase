import { setupServer } from 'msw/node'
import { GlobalAPIMocks } from './msw-global-api-mocks'
import { http, HttpResponse, HttpResponseResolver } from 'msw'
import { API_URL } from 'lib/constants'
import type { paths } from '../../data/api'

export const mswServer = setupServer(...GlobalAPIMocks)

mswServer.events.on('request:start', ({ request }) => {
  console.log('[MSW] Outgoing:', request.method, request.url)
})

// Recursively changes params in an endpoint path segment from {param}
// format to :param format which is expected by Mock Service Worker
type RemapParams<T extends string> = T extends `${infer Before}{${infer Param}}${infer After}`
  ? `${Before}:${Param}${RemapParams<After>}`
  : T

type TrimQueryParams<T extends string> = T extends `${infer Endpoint}?${string}` ? Endpoint : T

// We need to remap all keys from our openapi-typescript generated types
// so that they follow MSW's parameter formatting
type RemapPaths = {
  [K in keyof paths as RemapParams<K>]: paths[K]
}

type Endpoints = keyof RemapPaths
type Methods = Exclude<keyof typeof http, 'all'>

// Extract either the 200 or 201 response object
type SuccessResponse<P extends Endpoints, M extends Methods> = RemapPaths[P][M] extends {
  responses: { 200: { content: { 'application/json': infer R200 } } }
}
  ? R200
  : RemapPaths[P][M] extends {
        responses: { 201: { content: { 'application/json': infer R201 } } }
      }
    ? R201
    : never

const isResponseResolver = (val: unknown): val is HttpResponseResolver => typeof val === `function`

export const addAPIMock = <P extends Endpoints | `${Endpoints}?${string}`, M extends Methods>({
  method,
  path,
  response,
}: {
  method: M
  path: P
  response: SuccessResponse<TrimQueryParams<P>, M> | HttpResponseResolver
}) => {
  const fullPath = `${API_URL}${path}`
  console.log('[MSW] Adding mock:', method.toUpperCase(), fullPath)

  mswServer.use(
    http[method](
      fullPath,
      isResponseResolver(response)
        ? response
        : ({ request }) => {
            console.log('[MSW] Handling request:', request.method, request.url, response)
            return HttpResponse.json(response ?? null)
          }
    )
  )
}
