import { createHash, createHmac } from 'node:crypto'
import { type AcceptanceConfig, getAcceptanceConfig, joinUrl, requireConfigValue } from './config'

const EMPTY_SHA256_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
const STREAMING_PAYLOAD_ALGORITHM = 'STREAMING-AWS4-HMAC-SHA256-PAYLOAD'
const STREAMING_TRAILER_PAYLOAD_ALGORITHM = 'STREAMING-AWS4-HMAC-SHA256-PAYLOAD-TRAILER'

export async function sendAwsChunkedPutObject(options: {
  bucketName: string
  key: string
  payload: Buffer
}) {
  const config = getAcceptanceConfig()
  return sendAwsChunkedRequest({
    config,
    path: `/${options.bucketName}/${options.key}`,
    payload: options.payload,
  })
}

export async function sendAwsChunkedUploadPart(options: {
  bucketName: string
  key: string
  partNumber: number
  payload: Buffer
  uploadId: string
}) {
  const config = getAcceptanceConfig()
  return sendAwsChunkedRequest({
    config,
    path: `/${options.bucketName}/${options.key}`,
    payload: options.payload,
    query: {
      partNumber: String(options.partNumber),
      uploadId: options.uploadId,
    },
  })
}

export async function sendAwsChunkedTrailerModeWithoutTrailer(options: {
  bucketName: string
  key: string
  payload: Buffer
}) {
  const config = getAcceptanceConfig()
  return sendAwsChunkedRequest({
    config,
    contentSha: STREAMING_TRAILER_PAYLOAD_ALGORITHM,
    headers: {
      'x-amz-trailer': 'x-amz-checksum-crc32',
    },
    path: `/${options.bucketName}/${options.key}`,
    payload: options.payload,
  })
}

async function sendAwsChunkedRequest(options: {
  config: AcceptanceConfig
  contentSha?: string
  headers?: Record<string, string>
  path: string
  payload: Buffer
  query?: Record<string, string>
}) {
  const requestUrl = buildS3RequestUrl(options.config, options.path, options.query)
  const signedRequest = signS3Request({
    config: options.config,
    contentSha: options.contentSha ?? STREAMING_PAYLOAD_ALGORITHM,
    headers: {
      'content-encoding': 'aws-chunked',
      'x-amz-decoded-content-length': options.payload.length.toString(),
      ...(options.config.forwardedHost
        ? { 'x-forwarded-host': options.config.forwardedHost }
        : undefined),
      ...options.headers,
    },
    method: 'PUT',
    url: requestUrl,
  })
  const chunk = createSignedChunk(options.payload, signedRequest.signature, signedRequest)
  const endChunk = createSignedChunk(Buffer.alloc(0), chunk.signature, signedRequest)
  const encodedBody = Buffer.concat([chunk.encoded, endChunk.encoded])

  const response = await fetch(requestUrl, {
    body: encodedBody,
    headers: {
      ...signedRequest.headers,
      'content-length': encodedBody.length.toString(),
    },
    method: 'PUT',
  })

  return {
    body: await response.text(),
    headers: response.headers,
    status: response.status,
  }
}

function signS3Request(options: {
  config: AcceptanceConfig
  contentSha: string
  headers?: Record<string, string>
  method: string
  url: URL
}) {
  const longDate = formatAwsDate()
  const shortDate = longDate.slice(0, 8)
  const service = 's3'
  const credentialScope = `${shortDate}/${options.config.region}/${service}/aws4_request`
  const headers = normalizeHeaders({
    host: options.url.host,
    'x-amz-content-sha256': options.contentSha,
    'x-amz-date': longDate,
    ...options.headers,
  })
  const signedHeaders = Object.keys(headers).sort()
  const canonicalHeaders = signedHeaders.map((key) => `${key}:${headers[key]}`).join('\n')
  const canonicalRequest = [
    options.method.toUpperCase(),
    canonicalPath(options.url.pathname),
    canonicalQuery(options.url),
    `${canonicalHeaders}\n`,
    signedHeaders.join(';'),
    options.contentSha,
  ].join('\n')
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    longDate,
    credentialScope,
    sha256Hex(Buffer.from(canonicalRequest)),
  ].join('\n')
  const signingKey = deriveSigningKey(
    requireConfigValue(options.config.s3SecretAccessKey, 'ACCEPTANCE_S3_SECRET_ACCESS_KEY'),
    shortDate,
    options.config.region,
    service
  )
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex')
  const accessKeyId = requireConfigValue(
    options.config.s3AccessKeyId,
    'ACCEPTANCE_S3_ACCESS_KEY_ID'
  )

  return {
    contentSha: options.contentSha,
    headers: {
      ...headers,
      authorization:
        `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, ` +
        `SignedHeaders=${signedHeaders.join(';')}, Signature=${signature}`,
    },
    longDate,
    region: options.config.region,
    secretKey: requireConfigValue(
      options.config.s3SecretAccessKey,
      'ACCEPTANCE_S3_SECRET_ACCESS_KEY'
    ),
    service,
    shortDate,
    signature,
  }
}

function createSignedChunk(
  payload: Buffer,
  previousSignature: string,
  options: {
    longDate: string
    region: string
    secretKey: string
    service: string
    shortDate: string
  }
) {
  const signingKey = deriveSigningKey(
    options.secretKey,
    options.shortDate,
    options.region,
    options.service
  )
  const scope = `${options.shortDate}/${options.region}/${options.service}/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256-PAYLOAD',
    options.longDate,
    scope,
    previousSignature,
    EMPTY_SHA256_HASH,
    sha256Hex(payload),
  ].join('\n')
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex')

  return {
    encoded: Buffer.concat([
      Buffer.from(`${payload.length.toString(16)};chunk-signature=${signature}\r\n`),
      payload,
      Buffer.from('\r\n'),
    ]),
    signature,
  }
}

function buildS3RequestUrl(
  config: AcceptanceConfig,
  path: string,
  query?: Record<string, string>
): URL {
  const url = new URL(joinUrl(config.s3Endpoint, path))

  for (const [key, value] of Object.entries(query ?? {})) {
    url.searchParams.set(key, value)
  }

  return url
}

function deriveSigningKey(secretKey: string, shortDate: string, region: string, service: string) {
  const dateKey = hmacSha256(`AWS4${secretKey}`, shortDate)
  const regionKey = hmacSha256(dateKey, region)
  const serviceKey = hmacSha256(regionKey, service)
  return hmacSha256(serviceKey, 'aws4_request')
}

function hmacSha256(key: string | Buffer, value: string) {
  return createHmac('sha256', key).update(value).digest()
}

function sha256Hex(value: Buffer) {
  return createHash('sha256').update(value).digest('hex')
}

function formatAwsDate(date = new Date()) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '')
}

function normalizeHeaders(headers: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key.toLowerCase(),
      value.trim().replace(/\s+/g, ' '),
    ])
  )
}

function canonicalPath(pathname: string) {
  return pathname
    .split('/')
    .map((segment) => encodeRfc3986(decodeURIComponentSafe(segment)))
    .join('/')
}

function canonicalQuery(url: URL) {
  return Array.from(url.searchParams.entries())
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      if (leftKey === rightKey) {
        return leftValue.localeCompare(rightValue)
      }
      return leftKey.localeCompare(rightKey)
    })
    .map(([key, value]) => `${encodeRfc3986(key)}=${encodeRfc3986(value)}`)
    .join('&')
}

function encodeRfc3986(value: string) {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  )
}

function decodeURIComponentSafe(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
