import { request as httpRequest } from 'node:http'
import { type AddressInfo } from 'node:net'
import { Readable } from 'node:stream'
import { S3Client } from '@aws-sdk/client-s3'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import fastifyMultipart from '@fastify/multipart'
import Fastify, { type FastifyRequest } from 'fastify'
import { vi } from 'vitest'
import { createRawSignatureV4Signer } from '../../test/utils/signature-v4'

const { configState, getJwtSecretMock, verifyJwtMock, getTenantConfigMock } = vi.hoisted(() => ({
  configState: {
    requestAllowXForwardedPrefix: true,
    isMultitenant: false,
  },
  getJwtSecretMock: vi.fn(),
  verifyJwtMock: vi.fn(),
  getTenantConfigMock: vi.fn(),
}))

vi.mock('../../config', () => ({
  getConfig: () => ({
    anonKeyAsync: Promise.resolve('anon-key'),
    isMultitenant: configState.isMultitenant,
    jwtCachingEnabled: false,
    requestAllowXForwardedPrefix: configState.requestAllowXForwardedPrefix,
    s3ProtocolAccessKeyId: 'access-key',
    s3ProtocolAccessKeySecret: 'secret-key',
    s3ProtocolAllowForwardedHeader: false,
    s3ProtocolEnforceRegion: false,
    s3ProtocolNonCanonicalHostHeader: undefined,
    s3ProtocolPrefix: '',
    serviceKeyAsync: Promise.resolve('service-key'),
    storagePublicUrl: undefined,
    storageS3Region: 'us-east-1',
  }),
}))

vi.mock('@internal/auth', () => ({
  isJwtToken: () => false,
  signJWT: vi.fn(),
  verifyJWT: verifyJwtMock,
  verifyJWTWithCache: verifyJwtMock,
}))

vi.mock('@internal/database', () => ({
  getJwtSecret: getJwtSecretMock,
  getTenantConfig: getTenantConfigMock,
  s3CredentialsManager: {
    getS3CredentialsByAccessKey: vi.fn(),
  },
}))

const credentials = {
  accessKeyId: 'access-key',
  secretAccessKey: 'secret-key',
  region: 'us-east-1',
  service: 's3',
}

const forwardedPrefix = '/storage/v1'
const signRawPath = createRawSignatureV4Signer(credentials, {
  method: 'GET',
})

async function buildApp(requestAllowXForwardedPrefix: boolean, isMultitenant = false) {
  configState.requestAllowXForwardedPrefix = requestAllowXForwardedPrefix
  configState.isMultitenant = isMultitenant
  vi.resetModules()
  getJwtSecretMock.mockResolvedValue({
    secret: 'jwt-secret',
    jwks: null,
  })
  verifyJwtMock.mockResolvedValue({
    role: 'service_role',
    sub: 'service-user',
  })

  const { signatureV4 } = await import('./signature-v4')
  const app = Fastify()
  let handled = false
  let lastRequest: FastifyRequest | undefined

  app.decorateRequest('tenantId', 'tenant-id')
  app.addHook('onResponse', async (request) => {
    lastRequest = request
  })
  app.setErrorHandler((error, _request, reply) => {
    const storageError = error as Error & {
      code?: string
      httpStatusCode?: number
    }
    void reply.status(storageError.httpStatusCode ?? 500).send({
      code: storageError.code,
    })
  })
  app.register(fastifyMultipart)
  app.register(signatureV4, {
    allowBodyHash: false,
  })
  app.get('/:Bucket/*', async (_request, reply) => {
    handled = true
    return reply.status(204).send()
  })
  app.post('/:Bucket', async (request, reply) => {
    await request.multiPartFileStream?.toBuffer()
    handled = true
    return reply.status(204).send()
  })
  await app.listen({
    host: '127.0.0.1',
    port: 0,
  })

  return {
    app,
    wasHandled: () => handled,
    postPolicyContentLengthRange: () => lastRequest?.postPolicyContentLengthRange,
    multiPartFields: () => lastRequest?.multiPartFileStream?.fields,
  }
}

async function sendPost(
  app: ReturnType<typeof Fastify>,
  conditions: NonNullable<Parameters<typeof createPresignedPost>[1]['Conditions']>,
  size = 50,
  trailingField?: [string, string]
) {
  const client = new S3Client({
    endpoint: 'http://localhost',
    forcePathStyle: true,
    region: credentials.region,
    credentials,
  })
  try {
    const signed = await createPresignedPost(client, {
      Bucket: 'bucket',
      Key: 'object',
      Conditions: conditions,
    })
    const form = new FormData()
    for (const [name, value] of Object.entries(signed.fields)) {
      form.set(name, value)
    }
    form.set('file', new Blob([Buffer.alloc(size)]), 'object')
    if (trailingField) {
      form.append(...trailingField)
    }
    const request = new Request(signed.url, { method: 'POST', body: form })
    const body = Buffer.from(await request.arrayBuffer())
    let payload: Buffer | Readable = body
    if (trailingField) {
      // Deliver the part after the file in a later chunk, once the file part has
      // been parsed and the signature snapshot taken.
      const boundary = request.headers.get('content-type')!.split('boundary=')[1]
      const delimiter = `\r\n--${boundary}`
      const fileEnd = body.lastIndexOf(delimiter, body.lastIndexOf(delimiter) - 1) + 2
      payload = new Readable({ read() {} })
      payload.push(body.subarray(0, fileEnd))
      setTimeout(() => {
        ;(payload as Readable).push(body.subarray(fileEnd))
        ;(payload as Readable).push(null)
      }, 50)
    }
    return await app.inject({
      method: 'POST',
      url: new URL(signed.url).pathname,
      headers: Object.fromEntries(request.headers),
      payload,
    })
  } finally {
    client.destroy()
  }
}

describe('SignatureV4 plugin POST policy range', () => {
  it.each([
    { name: 'one range', bounds: [[10, 100]], expected: { min: 10, max: 100 } },
    {
      name: 'the last of several ranges',
      bounds: [
        [10, 100],
        [50, 200],
      ],
      expected: { min: 50, max: 200 },
    },
    { name: 'zero bounds', bounds: [[0, 0]], expected: { min: 0, max: 0 }, size: 0 },
    { name: 'no range', bounds: [], expected: undefined },
  ])('retains $name after authentication', async ({ bounds, expected, size }) => {
    const { app, wasHandled, postPolicyContentLengthRange } = await buildApp(false)
    try {
      const response = await sendPost(
        app,
        bounds.map(([min, max]) => ['content-length-range', min, max]),
        size
      )

      expect(response.statusCode, response.body).toBe(204)
      expect(wasHandled()).toBe(true)
      expect(postPolicyContentLengthRange()).toEqual(expected)
      if (expected) expect(Object.isFrozen(postPolicyContentLengthRange())).toBe(true)
    } finally {
      await app.close()
    }
  })

  it('ignores form fields that arrive after the file part', async () => {
    const { app, wasHandled, multiPartFields } = await buildApp(false)
    try {
      const response = await sendPost(app, [['content-length-range', 0, 100]], 50, [
        'x-amz-meta-evil',
        'yes',
      ])

      expect(response.statusCode, response.body).toBe(204)
      expect(wasHandled()).toBe(true)
      expect(multiPartFields()).not.toHaveProperty('x-amz-meta-evil')
    } finally {
      await app.close()
    }
  })

  it('does not retain the range when JWT authentication fails', async () => {
    const { app, wasHandled, postPolicyContentLengthRange } = await buildApp(false)
    verifyJwtMock.mockRejectedValueOnce(
      Object.assign(new Error('JWT rejected'), { httpStatusCode: 403 })
    )
    try {
      const response = await sendPost(app, [['content-length-range', 10, 100]])

      expect(response.statusCode).toBe(403)
      expect(wasHandled()).toBe(false)
      expect(postPolicyContentLengthRange()).toBeUndefined()
    } finally {
      await app.close()
    }
  })
})

async function sendRequest(
  app: ReturnType<typeof Fastify>,
  signedRequest: Awaited<ReturnType<typeof signRawPath>>,
  path: string
) {
  const address = app.server.address() as AddressInfo

  return await new Promise<{ body: string; statusCode: number | undefined }>((resolve, reject) => {
    const request = httpRequest(
      {
        host: '127.0.0.1',
        port: address.port,
        method: signedRequest.method,
        path,
        headers: {
          ...signedRequest.headers,
          'x-forwarded-prefix': forwardedPrefix,
        },
      },
      (response) => {
        const chunks: Buffer[] = []
        response.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
        response.on('end', () => {
          resolve({
            body: Buffer.concat(chunks).toString('utf8'),
            statusCode: response.statusCode,
          })
        })
      }
    )
    request.on('error', reject)
    request.end()
  })
}

describe('SignatureV4 plugin forwarded prefix', () => {
  it('verifies a raw external path using a trusted x-forwarded-prefix', async () => {
    const internalPath = '/bucket/folder/%2E%2E/object'
    const signedRequest = await signRawPath(`${forwardedPrefix}${internalPath}`)
    const { app, wasHandled } = await buildApp(true)

    try {
      const response = await sendRequest(app, signedRequest, internalPath)

      expect(response.statusCode).toBe(204)
      expect(wasHandled()).toBe(true)
    } finally {
      await app.close()
    }
  })

  it('ignores x-forwarded-prefix when forwarded paths are not trusted', async () => {
    const internalPath = '/bucket/folder/%2E%2E/object'
    const signedRequest = await signRawPath(`${forwardedPrefix}${internalPath}`)
    const { app, wasHandled } = await buildApp(false)

    try {
      const response = await sendRequest(app, signedRequest, internalPath)

      expect(response.statusCode).toBe(403)
      expect(JSON.parse(response.body)).toEqual({
        code: 'SignatureDoesNotMatch',
      })
      expect(wasHandled()).toBe(false)
    } finally {
      await app.close()
    }
  })
})

describe('SignatureV4 plugin session token secrets', () => {
  const internalPath = '/bucket/object'
  const sessionToken = 'session-jwt'

  function signWithSessionToken(secretAccessKey: string) {
    return createRawSignatureV4Signer(
      {
        ...credentials,
        accessKeyId: 'tenant-id',
        secretAccessKey,
        sessionToken,
      },
      { method: 'GET' }
    )(`${forwardedPrefix}${internalPath}`)
  }

  it.each([
    { name: 'tenantId', secret: 'tenant-id' },
    { name: 'anon key', secret: 'anon-key' },
  ])('verifies a session token request signed with the $name as secret', async ({ secret }) => {
    const signedRequest = await signWithSessionToken(secret)
    const { app, wasHandled } = await buildApp(true)

    try {
      const response = await sendRequest(app, signedRequest, internalPath)

      expect(response.statusCode).toBe(204)
      expect(wasHandled()).toBe(true)
      expect(verifyJwtMock).toHaveBeenCalledWith(sessionToken, 'jwt-secret', null)
    } finally {
      await app.close()
    }
  })

  it('rejects a session token request signed with an unknown secret', async () => {
    const signedRequest = await signWithSessionToken('unknown-secret')
    const { app, wasHandled } = await buildApp(true)

    try {
      const response = await sendRequest(app, signedRequest, internalPath)

      expect(response.statusCode).toBe(403)
      expect(JSON.parse(response.body)).toEqual({
        code: 'SignatureDoesNotMatch',
      })
      expect(wasHandled()).toBe(false)
    } finally {
      await app.close()
    }
  })

  it('verifies a tenantId-signed request for a tenant without an anon key', async () => {
    getTenantConfigMock.mockResolvedValue({ anonKey: undefined })
    const signedRequest = await signWithSessionToken('tenant-id')
    const { app, wasHandled } = await buildApp(true, true)

    try {
      const response = await sendRequest(app, signedRequest, internalPath)

      expect(response.statusCode).toBe(204)
      expect(wasHandled()).toBe(true)
      expect(getTenantConfigMock).toHaveBeenCalledWith('tenant-id')
    } finally {
      await app.close()
    }
  })
})
