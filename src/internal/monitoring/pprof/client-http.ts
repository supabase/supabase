import { type Dispatcher, request as undiciRequest } from 'undici'
import type { PprofRequestTargetType } from './download'
import type { ProfileClass, ProfileKind } from './store-key'

export interface PprofArchivedProfile {
  key: string
  class: ProfileClass
  kind: ProfileKind
  reason: string
  startedAt: string
  durationSeconds: number
  hostname: string
  applicationId?: string
  workerId?: string
  processId: number
  build: string
  size?: number
  etag?: string
}

export interface PprofArchivedProfileList {
  profiles: PprofArchivedProfile[]
  cursor?: string
}

export interface PprofCaptureTriggerResult {
  scheduled: true
  class: 'manual'
  kind: ProfileKind
  message: string
}

const PPROF_ERROR_BODY_MAX_BYTES = 4 * 1024

type PprofQueryValue = boolean | number | string | undefined

export function resolvePprofAdminUrl(
  baseUrl: string,
  requestPath: string,
  params?: Record<string, PprofQueryValue>
) {
  const url = new URL(baseUrl)
  const normalizedBasePath = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`
  const normalizedRequestPath = requestPath.replace(/^\/+/, '')

  url.hash = ''
  url.search = ''
  url.pathname =
    normalizedBasePath === '/'
      ? `/${normalizedRequestPath}`
      : `${normalizedBasePath}${normalizedRequestPath}`

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }

  return url.toString()
}

async function readResponseBody(body: Dispatcher.ResponseData['body']) {
  const chunks: Buffer[] = []
  let remaining = PPROF_ERROR_BODY_MAX_BYTES
  let truncated = false
  let complete = false

  try {
    for await (const value of body) {
      if (remaining === 0) {
        truncated = true
        break
      }
      const chunk = Buffer.from(value)
      const available = remaining
      chunks.push(chunk.subarray(0, available))
      remaining -= Math.min(chunk.byteLength, available)
      if (chunk.byteLength > available) truncated = true
      if (truncated) break
    }
    complete = !truncated
  } finally {
    if (!complete && !body.destroyed) body.destroy()
  }

  const text = Buffer.concat(chunks).toString('utf8').trim()
  return text ? `: ${text}${truncated ? '… [truncated]' : ''}` : ''
}

async function request(options: {
  adminUrl: string
  apiKey: string
  path: string
  params?: Record<string, PprofQueryValue>
  accept: string
}) {
  const response = await undiciRequest(
    resolvePprofAdminUrl(options.adminUrl, options.path, options.params),
    {
      headers: { Accept: options.accept, ApiKey: options.apiKey },
      method: 'GET',
    }
  )

  if (response.statusCode < 200 || response.statusCode >= 300) {
    const statusText = response.statusText ? ` ${response.statusText}` : ''
    throw new Error(
      `Pprof admin request failed: HTTP ${response.statusCode}${statusText}${await readResponseBody(response.body)}`
    )
  }
  return response
}

function asStream(response: Dispatcher.ResponseData) {
  const contentDisposition = response.headers['content-disposition']
  return {
    contentDisposition: Array.isArray(contentDisposition)
      ? contentDisposition[0]
      : contentDisposition,
    stream: response.body,
  }
}

export async function fetchPprofStream(options: {
  adminUrl: string
  apiKey: string
  type: Extract<PprofRequestTargetType, 'heap-snapshot'>
}) {
  return asStream(
    await request({
      adminUrl: options.adminUrl,
      apiKey: options.apiKey,
      path: `/debug/pprof/${options.type}`,
      accept: 'application/json',
    })
  )
}

export async function triggerPprofCapture(options: {
  adminUrl: string
  apiKey: string
  type: ProfileKind
  seconds: number
}) {
  const response = await request({
    adminUrl: options.adminUrl,
    apiKey: options.apiKey,
    path: `/debug/pprof/${options.type === 'cpu' ? 'profile' : 'heap'}`,
    params: { seconds: options.seconds },
    accept: 'application/json',
  })
  return (await response.body.json()) as PprofCaptureTriggerResult
}

export async function fetchArchivedProfiles(options: {
  adminUrl: string
  apiKey: string
  class: ProfileClass
  kind?: ProfileKind
  date?: string
  limit?: number
  cursor?: string
}) {
  const response = await request({
    adminUrl: options.adminUrl,
    apiKey: options.apiKey,
    path: '/debug/pprof/profiles',
    params: {
      class: options.class,
      kind: options.kind,
      date: options.date,
      limit: options.limit,
      cursor: options.cursor,
    },
    accept: 'application/json',
  })
  return (await response.body.json()) as PprofArchivedProfileList
}

export async function downloadArchivedProfile(options: {
  adminUrl: string
  apiKey: string
  key: string
}) {
  return asStream(
    await request({
      adminUrl: options.adminUrl,
      apiKey: options.apiKey,
      path: '/debug/pprof/profiles/download',
      params: { key: options.key },
      accept: 'application/gzip',
    })
  )
}
