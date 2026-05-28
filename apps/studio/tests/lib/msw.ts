import { DefaultBodyType, http, HttpResponse, HttpResponseResolver, PathParams } from 'msw'
import { setupServer } from 'msw/node'

import type { paths } from '../../data/api'
import { GlobalAPIMocks } from './msw-global-api-mocks'
import { API_URL } from '@/lib/constants'

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

// Studio's standard error envelope — what `handleError` and `ResponseError` consume.
// OpenAPI doesn't document error bodies (4xx/5xx are `content?: never`), so we
// hardcode this convention to keep error-state tests strongly typed.
export type APIErrorBody = { message: string }

// Resolver constrained to the OpenAPI success body (or the error envelope above).
// Catches drift between mocks and the API contract. `Extract<..., DefaultBodyType>`
// filters to the JSON-body subset to satisfy `HttpResponseResolver`'s body constraint.
type TypedResolver<P extends Endpoints, M extends Methods> = HttpResponseResolver<
  PathParams,
  DefaultBodyType,
  Extract<SuccessResponse<P, M>, DefaultBodyType> | APIErrorBody
>

const isResponseResolver = (val: unknown): val is HttpResponseResolver => typeof val === `function`

export const addAPIMock = <P extends Endpoints | `${Endpoints}?${string}`, M extends Methods>({
  method,
  path,
  response,
}: SuccessResponse<TrimQueryParams<P>, M> extends never
  ? // Endpoints with no documented JSON response body — resolver is optional, used
    // when the test needs to assert on the request or override the status.
    { method: M; path: P; response?: HttpResponseResolver }
  : {
      method: M
      path: P
      response: SuccessResponse<TrimQueryParams<P>, M> | TypedResolver<TrimQueryParams<P>, M>
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
