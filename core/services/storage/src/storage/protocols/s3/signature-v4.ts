import { createHash } from 'node:crypto'
import { Writable } from 'node:stream'
import { ERRORS } from '@internal/errors'
import crypto from 'crypto'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import { assertPolicyConditionsSatisfied, assertPolicyNotExpired, parsePolicy } from './policy'

export enum SignatureV4Service {
  S3 = 's3',
  S3VECTORS = 's3vectors',
}

interface SignatureV4Options {
  enforceRegion: boolean
  allowForwardedHeader?: boolean
  allowBodyHashing?: boolean
  nonCanonicalForwardedHost?: string
  publicUrl?: URL
  credentials: Omit<Credentials, 'shortDate'> & { secretKey: string | string[] }
}

export interface ClientSignature {
  credentials: Credentials
  signature: string
  signedHeaders: string[]
  sessionToken?: string
  longDate: string
  contentSha?: string
  policy?: {
    raw: string
    fields: Record<string, string>
  }
}

interface SignatureRequest {
  url: string
  body?: string | ReadableStream | Buffer | Readable
  headers: Record<string, string | string[]>
  method: string
  query?: Record<string, string>
  prefix?: string
  payloadHasher?: Writable & { digestHex: () => string }
  bucket?: string
}

interface Credentials {
  accessKey: string
  shortDate: string
  region: string
  service: string
}

type SignatureHeaders = Record<string, string | string[] | undefined>
type SignatureQuery = Record<string, unknown>

/**
 * Lists the headers that should never be included in the
 * request signature signature process.
 */
export const ALWAYS_UNSIGNABLE_HEADERS = {
  authorization: true,
  connection: true,
  expect: true,
  from: true,
  'keep-alive': true,
  'max-forwards': true,
  pragma: true,
  referer: true,
  te: true,
  trailer: true,
  'transfer-encoding': true,
  upgrade: true,
  'user-agent': true,
  'x-amzn-trace-id': true,
}

export const ALWAYS_UNSIGNABLE_QUERY_PARAMS = {
  'X-Amz-Signature': true,
}

export const EMPTY_SHA256_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'

/**
 * Encodes a URI component according to RFC 3986.
 * Unlike encodeURIComponent, this also encodes !'()* as required by AWS.
 */
export function encodeRFC3986URIComponent(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase()
  })
}

function canonicalUri(requestTarget: string, prefix?: string) {
  const queryIndex = requestTarget.indexOf('?')
  const path = queryIndex === -1 ? requestTarget : requestTarget.slice(0, queryIndex)
  const pathPrefix = prefix ? prefix.replace(/\/+$/, '') : ''

  return pathPrefix + path || '/'
}

export class SignatureV4 {
  public readonly serverCredentials: SignatureV4Options['credentials']
  enforceRegion: boolean
  allowForwardedHeader?: boolean
  allowBodyHashing?: boolean
  nonCanonicalForwardedHost?: string
  publicUrl?: URL
  private readonly signingKeyCache: {
    dateStamp: string
    regionName: string
    serviceName: string
    signingKey: Buffer
  }[] = []
  private readonly secretKeys: string[]
  // Index of the secret that matched during verify(); chunk signatures of a
  // streaming upload must be validated with the same secret as the seed signature.
  private matchedSecretIndex = 0

  constructor(options: SignatureV4Options) {
    this.serverCredentials = options.credentials
    this.secretKeys = Array.isArray(options.credentials.secretKey)
      ? options.credentials.secretKey
      : [options.credentials.secretKey]

    if (this.secretKeys.length === 0) {
      throw new Error('SignatureV4 requires at least one secret key')
    }

    this.enforceRegion = options.enforceRegion
    this.allowForwardedHeader = options.allowForwardedHeader
    this.allowBodyHashing = options.allowBodyHashing
    this.nonCanonicalForwardedHost = options.nonCanonicalForwardedHost
    this.publicUrl = options.publicUrl
  }

  static parseAuthorizationHeader(headers: SignatureHeaders) {
    const clientSignature = headers.authorization
    if (typeof clientSignature !== 'string') {
      throw ERRORS.InvalidSignature('Missing authorization header')
    }

    const parts = clientSignature.split(' ')
    if (parts[0] !== 'AWS4-HMAC-SHA256') {
      throw ERRORS.InvalidSignature('Unsupported authorization type')
    }

    const params = this.extractClientSignature(clientSignature)
    const credentialPart = params.get('Credential')
    const signedHeadersPart = params.get('SignedHeaders')
    const signature = params.get('Signature')
    const longDate = headers['x-amz-date']
    const contentSha = coerceOptionalString(headers['x-amz-content-sha256'])
    const sessionToken = coerceOptionalString(headers['x-amz-security-token'])

    if (
      !isString(credentialPart) ||
      !isString(signedHeadersPart) ||
      !isString(signature) ||
      !isString(longDate)
    ) {
      throw ERRORS.InvalidSignature('Invalid signature format')
    }

    const signedHeaders = signedHeadersPart.split(';')
    const credentialsPart = credentialPart.split('/')

    if (credentialsPart.length !== 5) {
      throw ERRORS.InvalidSignature('Invalid credentials')
    }

    const [accessKey, shortDate, region, service] = credentialsPart
    return {
      credentials: { accessKey, shortDate, region, service },
      signedHeaders,
      signature,
      longDate,
      contentSha,
      sessionToken,
    }
  }

  static isChunkedUpload(headers: SignatureHeaders): boolean {
    const sha = headers['x-amz-content-sha256']
    if (typeof sha !== 'string') return false
    // If it exactly matches or starts with streaming prefix...
    return (
      sha.startsWith('STREAMING-AWS4-HMAC-SHA256-PAYLOAD') ||
      sha.startsWith('STREAMING-UNSIGNED-PAYLOAD')
    )
  }

  static parseQuerySignature(query: SignatureQuery) {
    const credentialPart = query['X-Amz-Credential']
    const signedHeaders = query['X-Amz-SignedHeaders']
    const signature = query['X-Amz-Signature']
    const longDate = query['X-Amz-Date']
    const contentSha = coerceOptionalString(query['X-Amz-Content-Sha256'])
    const sessionToken = coerceOptionalString(query['X-Amz-Security-Token'])
    const expires = coerceOptionalString(query['X-Amz-Expires'])

    if (
      !isString(credentialPart) ||
      !isString(signedHeaders) ||
      !isString(signature) ||
      !isString(longDate)
    ) {
      throw ERRORS.InvalidSignature('Invalid signature format')
    }

    if (expires) {
      this.checkExpiration(longDate, expires)
    }

    const credentialsPart = credentialPart.split('/')
    if (credentialsPart.length !== 5) {
      throw ERRORS.InvalidSignature('Invalid credentials')
    }

    const [accessKey, shortDate, region, service] = credentialsPart
    return {
      credentials: { accessKey, shortDate, region, service },
      signedHeaders: signedHeaders.split(';'),
      signature,
      longDate,
      contentSha,
      sessionToken,
    }
  }

  static parseMultipartSignature(form: FormData) {
    const credentialPart = form.get('X-Amz-Credential')
    const signature = form.get('X-Amz-Signature')
    const longDate = form.get('X-Amz-Date')
    const policy = form.get('Policy')
    const contentSha = coerceOptionalString(form.get('X-Amz-Content-Sha256'))
    const sessionToken = coerceOptionalString(form.get('X-Amz-Security-Token'))

    if (
      !isString(credentialPart) ||
      !isString(signature) ||
      !isString(policy) ||
      !isString(longDate)
    ) {
      throw ERRORS.InvalidSignature('Invalid signature format')
    }

    const fields: Record<string, string> = Object.create(null)
    form.forEach((value, key) => {
      if (typeof value !== 'string') {
        return
      }
      const normalizedKey = key.toLowerCase()
      if (Object.prototype.hasOwnProperty.call(fields, normalizedKey)) {
        throw ERRORS.InvalidSignature('Duplicate form field in POST policy request')
      }
      fields[normalizedKey] = value
    })

    const credentialsPart = credentialPart.split('/')
    if (credentialsPart.length !== 5) {
      throw ERRORS.InvalidSignature('Invalid credentials')
    }

    const [accessKey, shortDate, region, service] = credentialsPart
    return {
      credentials: { accessKey, shortDate, region, service },
      signedHeaders: [],
      signature,
      longDate,
      contentSha,
      sessionToken,
      policy: {
        raw: policy,
        fields,
      },
    }
  }

  protected static checkExpiration(longDate: string, expires: string) {
    const expiresSec = parseInt(expires, 10)
    if (isNaN(expiresSec) || expiresSec < 0) {
      throw ERRORS.InvalidSignature('Invalid expiration')
    }

    const isoLongDate = longDate.replace(
      /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
      '$1-$2-$3T$4:$5:$6Z'
    )
    const requestDate = new Date(isoLongDate)
    const expirationDate = new Date(requestDate.getTime() + expiresSec * 1000)
    const isExpired = expirationDate < new Date()

    if (isExpired) {
      throw ERRORS.ExpiredSignature()
    }
  }

  protected static extractClientSignature(clientSignature: string) {
    return clientSignature
      .replace('AWS4-HMAC-SHA256 ', '')
      .split(',')
      .reduce((values, value) => {
        const [k, v] = value.split('=')
        values.set(k.trim(), v)
        return values
      }, new Map<string, string>())
  }

  /**
   * Verify if client signature and server signature matches
   * @param clientSignature
   * @param request
   */
  async verify(clientSignature: ClientSignature, request: SignatureRequest) {
    if (typeof clientSignature.policy?.raw === 'string') {
      const verified = this.verifyPostPolicySignature(clientSignature, clientSignature.policy.raw)
      if (!verified) {
        return false
      }

      const value = parsePolicy(clientSignature.policy.raw)

      // A POST policy must declare an expiration; AWS treats a missing one as
      // invalid. Without this check a signed policy with no expiration would never
      // expire and could be replayed forever.
      assertPolicyNotExpired(value.expiration)
      assertPolicyConditionsSatisfied(value, clientSignature.policy.fields, request.bucket)
      return true
    }

    const serverSignature = await this.sign(clientSignature, request)
    return this.matchClientSignature(clientSignature.signature, serverSignature.signatures)
  }

  /**
   * Verifies signature for POST upload requests
   * @param clientSignature
   * @param policy
   */
  verifyPostPolicySignature(clientSignature: ClientSignature, policy: string) {
    const serverSignatures = this.signPostPolicy(clientSignature, policy)
    return this.matchClientSignature(clientSignature.signature, serverSignatures)
  }

  public validateChunkSignature(
    clientSignature: ClientSignature,
    chunkHash: string,
    chunkSignature: string,
    prevSignature: string = clientSignature.signature
  ): boolean {
    const { shortDate, region, service } = clientSignature.credentials
    const signingKey = this.getCachedSigningKey(shortDate, region, service, this.matchedSecretIndex)

    // Build the “String to Sign” for this chunk exactly per AWS:
    //    AWS4-HMAC-SHA256-PAYLOAD
    //    <longDate>
    //    <shortDate/region/service/aws4_request>
    //    <prevSignature>
    //    SHA256("")   ← the hash of the empty string
    //    SHA256(chunkData)
    const scope = `${shortDate}/${region}/${service}/aws4_request`
    const stringToSign = [
      'AWS4-HMAC-SHA256-PAYLOAD',
      clientSignature.longDate,
      scope,
      prevSignature,
      EMPTY_SHA256_HASH,
      chunkHash,
    ].join('\n')

    // 4) HMAC it with the derived key and compare
    const expected = this.hmac(signingKey, stringToSign)
    const clientSig = Buffer.from(chunkSignature, 'hex')
    return clientSig.length === expected.length && crypto.timingSafeEqual(expected, clientSig)
  }

  signPostPolicy(clientSignature: ClientSignature, policy: string) {
    const serverCredentials = this.serverCredentials

    this.validateCredentials(clientSignature.credentials)
    const selectedRegion = this.getSelectedRegion(clientSignature.credentials.region)

    return this.secretKeys.map((_, index) => {
      const signingKey = this.getCachedSigningKey(
        clientSignature.credentials.shortDate,
        selectedRegion,
        serverCredentials.service,
        index
      )

      return this.hmac(signingKey, policy).toString('hex')
    })
  }

  /**
   * Sign the server side signature
   * @param clientSignature
   * @param request
   */
  async sign(clientSignature: ClientSignature, request: SignatureRequest) {
    const serverCredentials = this.serverCredentials

    this.validateCredentials(clientSignature.credentials)

    const longDate = clientSignature.longDate
    if (!longDate) {
      throw ERRORS.AccessDenied('No date provided')
    }

    const selectedRegion = this.getSelectedRegion(clientSignature.credentials.region)
    const canonicalRequest = await this.constructCanonicalRequest(
      clientSignature,
      request,
      clientSignature.signedHeaders
    )

    const stringToSign = this.constructStringToSign(
      longDate,
      clientSignature.credentials.shortDate,
      selectedRegion,
      serverCredentials.service,
      canonicalRequest
    )

    const signatures = this.secretKeys.map((_, index) => {
      const signingKey = this.getCachedSigningKey(
        clientSignature.credentials.shortDate,
        selectedRegion,
        serverCredentials.service,
        index
      )

      return this.hmac(signingKey, stringToSign).toString('hex')
    })

    return { signatures, canonicalRequest }
  }

  protected async getPayloadHash(clientSignature: ClientSignature, request: SignatureRequest) {
    const body = request.body

    // For presigned URLs and GET requests, use UNSIGNED-PAYLOAD
    if (request.query && request.query['X-Amz-Signature'] && request.method === 'GET') {
      return 'UNSIGNED-PAYLOAD'
    }

    // If contentSha is provided, use it
    if (clientSignature.contentSha) {
      return clientSignature.contentSha
    }

    // If the body is undefined, use the hash of an empty string
    if (body === null || body === undefined) {
      return EMPTY_SHA256_HASH
    }

    // Calculate the SHA256 hash of the body
    if (typeof body === 'string' || ArrayBuffer.isView(body)) {
      return crypto
        .createHash('sha256')
        .update(typeof body === 'string' ? body : Buffer.from(body.buffer))
        .digest('hex')
    }

    // If body is a ReadableStream, calculate the SHA256 hash of the stream
    if (body instanceof Readable && this.allowBodyHashing && request.payloadHasher) {
      return await pipeline(body, request.payloadHasher).then(() => {
        return request.payloadHasher?.digestHex()
      })
    }

    // Default to UNSIGNED-PAYLOAD if body is not a string or ArrayBuffer
    return 'UNSIGNED-PAYLOAD'
  }

  protected async constructCanonicalRequest(
    clientSignature: ClientSignature,
    request: SignatureRequest,
    signedHeaders: string[]
  ) {
    const method = request.method
    const uri = canonicalUri(request.url, request.prefix)
    const canonicalQueryString = this.constructCanonicalQueryString(request.query || {})
    const canonicalHeaders = this.constructCanonicalHeaders(request, signedHeaders)
    const signedHeadersString = signedHeaders.sort().join(';')
    const payloadHash = await this.getPayloadHash(clientSignature, request)

    return `${method}\n${uri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeadersString}\n${payloadHash}`
  }

  protected constructCanonicalQueryString(query: Record<string, string>) {
    return Object.keys(query)
      .filter((key) => !(key in ALWAYS_UNSIGNABLE_QUERY_PARAMS))
      .sort()
      .map(
        (key) =>
          `${encodeRFC3986URIComponent(key)}=${encodeRFC3986URIComponent(query[key] as string)}`
      )
      .join('&')
  }

  protected constructCanonicalHeaders(request: SignatureRequest, signedHeaders: string[]) {
    return (
      signedHeaders
        .filter(
          (header) =>
            request.headers[header] !== undefined &&
            !(header.toLowerCase() in ALWAYS_UNSIGNABLE_HEADERS)
        )
        .sort()
        .map((header) => {
          if (header === 'host') {
            return this.getHostHeader(request)
          }

          if (header === 'content-length') {
            const headerValue = this.getHeader(request, header) ?? '0'
            return `${header}:${headerValue}`
          }

          // cloudflare modifies accept-encoding header which causes signing to fail
          // instead use x-original-accept-encoding if available
          if (header === 'accept-encoding') {
            const originalEncoding = this.getHeader(request, 'x-original-accept-encoding')
            if (originalEncoding) {
              return `${header}:${originalEncoding}`
            }
          }

          return `${header}:${this.getHeader(request, header)}`
        })
        .join('\n') + '\n'
    )
  }

  protected getHostHeader(request: SignatureRequest) {
    // When a public URL is configured, use its host for signature verification.
    // This avoids proxy header issues (e.g., Kong overwriting X-Forwarded-Port).
    if (this.publicUrl) {
      return `host:${this.publicUrl.host}`
    }

    if (this.allowForwardedHeader) {
      const forwarded = this.getHeader(request, 'forwarded')
      if (forwarded) {
        const extractedHost = /host="?([^";]+)/.exec(forwarded)?.[1]
        if (extractedHost) {
          return `host:${extractedHost.toLowerCase()}`
        }
      }
    }

    if (this.nonCanonicalForwardedHost) {
      const xForwardedHost = this.getHeader(request, this.nonCanonicalForwardedHost.toLowerCase())
      if (xForwardedHost) {
        return `host:${xForwardedHost.toLowerCase()}`
      }
    }

    const xForwardedHost = this.getHeader(request, 'x-forwarded-host')
    if (xForwardedHost) {
      const port = this.getHeader(request, 'x-forwarded-port')
      const host = `host:${xForwardedHost.toLowerCase()}`

      if (port && !['443', '80'].includes(port)) {
        if (!xForwardedHost.includes(':')) {
          return host + ':' + port
        } else {
          return 'host:' + xForwardedHost.replace(/:\d+$/, `:${port}`)
        }
      }
      return host
    }

    return `host:${this.getHeader(request, 'host')}`
  }

  protected validateCredentials(credentials: Credentials) {
    if (credentials.accessKey !== this.serverCredentials.accessKey) {
      throw ERRORS.AccessDenied('Invalid Access Key')
    }

    if (this.enforceRegion && credentials.region !== this.serverCredentials.region) {
      throw ERRORS.AccessDenied('Invalid Region')
    }

    if (credentials.service !== this.serverCredentials.service) {
      throw ERRORS.AccessDenied('Invalid Service')
    }
  }

  protected getSelectedRegion(clientRegion: string) {
    if (
      !this.enforceRegion &&
      ['auto', 'us-east-1', this.serverCredentials.region, ''].includes(clientRegion)
    ) {
      return clientRegion
    }
    return this.serverCredentials.region
  }

  protected constructStringToSign(
    date: string,
    dateStamp: string,
    region: string,
    service: string,
    canonicalRequest: string
  ) {
    const algorithm = 'AWS4-HMAC-SHA256'
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
    const hashedCanonicalRequest = crypto
      .createHash('sha256')
      .update(canonicalRequest)
      .digest('hex')

    return `${algorithm}\n${date}\n${credentialScope}\n${hashedCanonicalRequest}`
  }

  protected signingKey(
    key: string,
    dateStamp: string,
    regionName: string,
    serviceName: string
  ): Buffer {
    const kDate = this.hmac(`AWS4${key}`, dateStamp)
    const kRegion = this.hmac(kDate, regionName)
    const kService = this.hmac(kRegion, serviceName)
    return this.hmac(kService, 'aws4_request')
  }

  private getCachedSigningKey(
    dateStamp: string,
    regionName: string,
    serviceName: string,
    secretIndex = 0
  ) {
    const cached = this.signingKeyCache[secretIndex]
    if (
      cached?.dateStamp === dateStamp &&
      cached.regionName === regionName &&
      cached.serviceName === serviceName
    ) {
      return cached.signingKey
    }

    const signingKey = this.signingKey(
      this.secretKeys[secretIndex],
      dateStamp,
      regionName,
      serviceName
    )
    this.signingKeyCache[secretIndex] = { dateStamp, regionName, serviceName, signingKey }
    return signingKey
  }

  private matchClientSignature(clientSignature: string, serverSignatures: string[]) {
    const clientSig = Buffer.from(clientSignature)

    for (const [index, candidate] of serverSignatures.entries()) {
      const serverSig = Buffer.from(candidate)
      if (clientSig.length === serverSig.length && crypto.timingSafeEqual(clientSig, serverSig)) {
        this.matchedSecretIndex = index
        return true
      }
    }

    return false
  }

  protected async sha256OfRequest(req: Readable) {
    const hash = createHash('sha256')
    for await (const chunk of req) {
      hash.update(chunk)
    }
    return hash.digest('hex')
  }

  protected hmac(key: string | Buffer, data: string): Buffer {
    return crypto.createHmac('sha256', key).update(data).digest()
  }

  protected getHeader(request: SignatureRequest, name: string) {
    const item = request.headers[name]
    const value = Array.isArray(item) ? item.join(',') : item
    return value?.trim().replace(/\s+/g, ' ')
  }
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function coerceOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined
  }

  return String(value)
}
