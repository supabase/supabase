import { ErrorCode, type StorageBackendError } from '@internal/errors'
import type { SignRequestOptions } from 'aws-sigv4-sign'
import JSONBigint from 'json-bigint'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { spyOnAbortSignalTimeout } from '../../../../test/utils/abort-signal'

const mockSignRequest = vi.fn()
vi.mock('aws-sigv4-sign', () => ({
  signRequest: (...args: unknown[]) => mockSignRequest(...args),
}))

import { type IcebergError, IcebergErrorType } from './errors'
import { BearerTokenAuth, RestCatalogClient, SignV4Auth } from './rest-catalog-client'

type TestableRestCatalogClient = {
  request<T>(input: {
    method?: string
    url: string
    params?: Record<
      string,
      string | number | boolean | readonly (string | number | boolean)[] | null | undefined
    >
    data?: unknown
    headers?: Record<string, string>
  }): Promise<T>
}

describe('RestCatalogClient request pipeline', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ defaults: {} }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
    )
    vi.stubGlobal('fetch', fetchMock)

    mockSignRequest.mockReset()
    mockSignRequest.mockImplementation(
      async () =>
        new Request('https://signed.example.com/', {
          headers: { 'x-amz-date': '20200101T000000Z', authorization: 'AWS4-HMAC-SHA256 ...' },
        })
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('preserves the catalogUrl path segment in the fetched URL', async () => {
    const client = new RestCatalogClient({
      catalogUrl: 'https://s3tables.ap-southeast-1.amazonaws.com/iceberg/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    await client.getConfig({ warehouse: 'wh' })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain('/iceberg/v1/config')
  })

  it('preserves query and configured fragment in the request URL string', async () => {
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1?token=abc#frag',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    await client.listNamespaces({ warehouse: 'wh' })

    const url = new URL(fetchMock.mock.calls[0][0] as string)
    expect(url.pathname).toBe('/v1/wh/namespaces')
    expect(url.searchParams.get('token')).toBe('abc')
    expect(fetchMock.mock.calls[0][0]).toContain('#frag')
    expect(url.hash).toBe('#frag')
  })

  it('preserves the catalogUrl path segment for nested resources', async () => {
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/some/prefix',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    await client.loadTable({ warehouse: 'wh', namespace: 'ns', table: 'tbl' })

    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain('/some/prefix/')
    expect(url).toMatch(/\/wh\/namespaces\/ns\/tables\/tbl/)
  })

  it('signs the exact URL that fetch is called with (SigV4)', async () => {
    const client = new RestCatalogClient({
      catalogUrl: 'https://s3tables.ap-southeast-1.amazonaws.com/iceberg/v1',
      auth: new SignV4Auth({ region: 'us-east-1' }),
    })

    await client.getConfig({ warehouse: 'my-warehouse' })

    expect(mockSignRequest).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const signedUrl = mockSignRequest.mock.calls[0][0] as string
    const fetchedUrl = fetchMock.mock.calls[0][0] as string

    expect(fetchedUrl).toBe(signedUrl)
  })

  it('produces identical signed and fetched params even when params include empty strings', async () => {
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new SignV4Auth({ region: 'us-east-1' }),
    })

    await client.listNamespaces({ warehouse: 'wh', pageToken: '', parent: 'p' })

    const signedUrl = mockSignRequest.mock.calls[0][0] as string
    const fetchedUrl = fetchMock.mock.calls[0][0] as string

    const signed = new URL(signedUrl)
    const fetched = new URL(fetchedUrl)

    expect(fetched.pathname).toBe(signed.pathname)
    expect(fetched.searchParams.toString()).toBe(signed.searchParams.toString())
    expect(fetched.searchParams.has('pageToken')).toBe(true)
    expect(fetched.searchParams.get('pageToken')).toBe('')
    expect(fetched.searchParams.get('parent')).toBe('p')
  })

  it('treats null data the same as undefined: no body, no Content-Type', async () => {
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    }) as unknown as TestableRestCatalogClient

    await client.request<unknown>({
      url: '/wh/namespaces',
      method: 'POST',
      data: null,
    })

    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(init.body).toBeUndefined()
    expect(new Headers(init.headers).has('content-type')).toBe(false)
  })

  it('serializes scalar query params and skips nullish values', async () => {
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    }) as unknown as TestableRestCatalogClient

    await client.request<unknown>({
      url: '/wh/namespaces',
      params: {
        empty: '',
        zero: 0,
        enabled: false,
        missing: undefined,
        nil: null,
      },
    })

    const url = new URL(fetchMock.mock.calls[0][0] as string)
    expect(url.searchParams.get('empty')).toBe('')
    expect(url.searchParams.get('zero')).toBe('0')
    expect(url.searchParams.get('enabled')).toBe('false')
    expect(url.searchParams.has('missing')).toBe(false)
    expect(url.searchParams.has('nil')).toBe(false)
  })

  it('serializes array query params using OpenAPI form explode syntax', async () => {
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    }) as unknown as TestableRestCatalogClient

    await client.request<unknown>({
      url: '/wh/namespaces',
      params: {
        namespace: ['a', 'b'],
        mixed: ['x', 1, false],
      },
    })

    const url = new URL(fetchMock.mock.calls[0][0] as string)
    expect(url.searchParams.getAll('namespace')).toEqual(['a', 'b'])
    expect(url.searchParams.getAll('mixed')).toEqual(['x', '1', 'false'])
    expect(url.search).toContain('namespace=a&namespace=b')
    expect(url.search).not.toContain('namespace%5B%5D=')
    expect(url.search).not.toContain('namespace=a%2Cb')
  })

  it('rejects unsupported query param objects instead of stringifying them', async () => {
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    }) as unknown as TestableRestCatalogClient

    await expect(
      client.request<unknown>({
        url: '/wh/namespaces',
        params: { filter: { name: 'ns' } } as unknown as Record<string, string>,
      })
    ).rejects.toMatchObject({
      code: ErrorCode.InternalError,
      message: 'Unsupported Iceberg catalog query parameter',
      originalError: expect.objectContaining({
        message: 'Unsupported query parameter "filter" type: object',
      }),
    } satisfies Partial<StorageBackendError>)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('encodes namespace and table path segments', async () => {
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    await client.loadTable({
      warehouse: 'wh',
      namespace: 'ns/a b?#æ',
      table: 'tbl/a b?#æ',
    })

    const url = new URL(fetchMock.mock.calls[0][0] as string)
    expect(url.pathname).toBe(
      '/v1/wh/namespaces/ns%2Fa%20b%3F%23%C3%A6/tables/tbl%2Fa%20b%3F%23%C3%A6'
    )
  })

  it('signs the same URL for POST requests with a body', async () => {
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new SignV4Auth({ region: 'us-east-1' }),
    })

    await client.createNamespace({
      warehouse: 'wh',
      namespace: ['a', 'b'],
      properties: { k: 'v' },
    })

    const signedUrl = mockSignRequest.mock.calls[0][0] as string
    const fetchedUrl = fetchMock.mock.calls[0][0] as string
    expect(fetchedUrl).toBe(signedUrl)
  })

  it('sends Accept: application/json on every request', async () => {
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    await client.getConfig({ warehouse: 'wh' })

    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(new Headers(init.headers).get('accept')).toBe('application/json')
  })

  it('preserves an explicitly provided Accept header', async () => {
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    }) as unknown as TestableRestCatalogClient

    await client.request<unknown>({
      url: '/wh/namespaces',
      headers: { Accept: 'application/vnd.iceberg.table.v1+json' },
    })

    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(new Headers(init.headers).get('accept')).toBe('application/vnd.iceberg.table.v1+json')
  })

  it('sends bearer auth headers to fetch', async () => {
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 'catalog-token' }),
    })

    await client.getConfig({ warehouse: 'wh' })

    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer catalog-token')
  })

  it('sends SigV4 headers to fetch', async () => {
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new SignV4Auth({ region: 'us-east-1' }),
    })

    await client.getConfig({ warehouse: 'wh' })

    const init = fetchMock.mock.calls[0][1] as RequestInit
    const headers = new Headers(init.headers)
    expect(headers.get('x-amz-date')).toBe('20200101T000000Z')
    expect(headers.get('authorization')).toBe('AWS4-HMAC-SHA256 ...')
  })

  it('can sign Headers-based URL-encoded catalog requests with the real SigV4 signer', async () => {
    const actual = await vi.importActual<typeof import('aws-sigv4-sign')>('aws-sigv4-sign')
    mockSignRequest.mockImplementationOnce(
      (input: string | Request | URL, init: RequestInit, options: SignRequestOptions) =>
        actual.signRequest(input, init, options)
    )
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new SignV4Auth({
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'AKIDEXAMPLE',
          secretAccessKey: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
        },
      }),
    })

    await client.loadTable({
      warehouse: 'warehouse with space',
      namespace: 'ns/a b?#æ',
      table: 'tbl/a b?#æ',
    })

    const url = new URL(fetchMock.mock.calls[0][0] as string)
    expect(url.pathname).toBe(
      '/v1/warehouse%20with%20space/namespaces/ns%2Fa%20b%3F%23%C3%A6/tables/tbl%2Fa%20b%3F%23%C3%A6'
    )

    const init = fetchMock.mock.calls[0][1] as RequestInit
    const headers = new Headers(init.headers)
    expect(headers.get('x-amz-date')).toMatch(/^\d{8}T\d{6}Z$/)
    expect(headers.get('authorization')).toContain('AWS4-HMAC-SHA256')
    expect(headers.get('authorization')).toContain('SignedHeaders=')

    const signedInit = mockSignRequest.mock.calls[0][1] as RequestInit
    expect(signedInit.headers).toBeInstanceOf(Headers)
  })

  it('passes a timeout signal to fetch', async () => {
    const timeout = spyOnAbortSignalTimeout()
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
      timeoutMs: 1234,
    })

    await client.getConfig({ warehouse: 'wh' })

    expect(timeout.timeoutSpy).toHaveBeenCalledWith(1234)
    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(init.signal).toBe(timeout.timeoutSignal)
  })

  it('uses a 60 second timeout by default', async () => {
    const timeout = spyOnAbortSignalTimeout()
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    await client.getConfig({ warehouse: 'wh' })

    expect(timeout.timeoutSpy).toHaveBeenCalledWith(60_000)
    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(init.signal).toBe(timeout.timeoutSignal)
  })

  it('omits the timeout signal when timeoutMs is 0', async () => {
    const timeout = spyOnAbortSignalTimeout()
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
      timeoutMs: 0,
    })

    await client.getConfig({ warehouse: 'wh' })

    expect(timeout.timeoutSpy).not.toHaveBeenCalled()
    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(init.signal).toBeUndefined()
  })

  it('serializes request bodies with JSONBigint', async () => {
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })
    const largeFieldId = JSONBigint.parse('9223372036854775807')

    await client.createTable({
      warehouse: 'wh',
      namespace: 'ns',
      name: 'tbl',
      schema: {
        type: 'struct',
        fields: [
          {
            id: largeFieldId as number,
            name: 'id',
            type: 'long',
            required: true,
          },
        ],
      },
      spec: { fields: [] },
    })

    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(init.body).toContain('"id":9223372036854775807')
    expect(new Headers(init.headers).get('content-type')).toBe('application/json')
  })

  it('omits path-only parameters from table request bodies', async () => {
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })
    const schema = { type: 'struct' as const, fields: [] }
    const spec = { fields: [] }

    await client.createTable({
      warehouse: 'wh',
      namespace: 'ns',
      name: 'tbl',
      schema,
      spec,
    })
    await client.updateTable({
      warehouse: 'wh',
      namespace: 'ns',
      table: 'tbl',
      requirements: [],
      updates: [],
    })

    const createInit = fetchMock.mock.calls[0][1] as RequestInit
    expect(JSON.parse(String(createInit.body))).toEqual({
      name: 'tbl',
      schema,
      spec,
    })

    const updateInit = fetchMock.mock.calls[1][1] as RequestInit
    expect(JSON.parse(String(updateInit.body))).toEqual({
      requirements: [],
      updates: [],
    })
  })

  it('parses response bodies with JSONBigint', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        '{"metadata-location":"s3://bucket/metadata.json","metadata":{"format-version":2,"table-uuid":"table-id","last-updated-ms":9223372036854775807}}',
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    const result = await client.loadTable({ warehouse: 'wh', namespace: 'ns', table: 'tbl' })

    expect(String(result.metadata['last-updated-ms'])).toBe('9223372036854775807')
  })

  it.each([
    'application/json',
    ' application/json ; charset=utf-8',
    'application/problem+json',
    'application/vnd.iceberg+json; charset=utf-8',
  ])('accepts JSON content type %s', async (contentType) => {
    fetchMock.mockResolvedValueOnce(
      new Response('{"defaults":{"clients":"4"}}', {
        status: 200,
        headers: { 'Content-Type': contentType },
      })
    )
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    await expect(client.getConfig({ warehouse: 'wh' })).resolves.toMatchObject({
      defaults: { clients: '4' },
    })
  })

  it('rejects non-JSON successful responses with a specific internal error', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('not json', { status: 200, headers: { 'Content-Type': 'text/plain' } })
    )
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    await expect(client.getConfig({ warehouse: 'wh' })).rejects.toMatchObject({
      code: ErrorCode.InternalError,
      message: 'Unexpected non-JSON response from Iceberg catalog',
      originalError: expect.objectContaining({
        message: 'Unexpected Content-Type: text/plain',
      }),
    } satisfies Partial<StorageBackendError>)
  })

  it('throws a structured error for empty successful responses on JSON-returning endpoints', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('', { status: 200, headers: { 'Content-Type': 'application/json' } })
    )
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    await expect(
      client.loadTable({ warehouse: 'wh', namespace: 'ns', table: 'tbl' })
    ).rejects.toMatchObject({
      code: ErrorCode.InternalError,
      message: 'Iceberg catalog returned an empty response body',
      originalError: expect.objectContaining({
        message: 'Empty Iceberg loadTable response body',
      }),
    } satisfies Partial<StorageBackendError>)
  })

  it('throws a structured error when getConfig response body is empty', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('', { status: 200, headers: { 'Content-Type': 'application/json' } })
    )
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    await expect(client.getConfig({ warehouse: 'wh' })).rejects.toMatchObject({
      code: ErrorCode.InternalError,
      message: 'Iceberg catalog returned an empty response body',
      originalError: expect.objectContaining({
        message: 'Empty Iceberg getConfig response body',
      }),
    } satisfies Partial<StorageBackendError>)
  })

  it('throws a structured error when a required response body is JSON null', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('null', { status: 200, headers: { 'Content-Type': 'application/json' } })
    )
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    await expect(
      client.loadTable({ warehouse: 'wh', namespace: 'ns', table: 'tbl' })
    ).rejects.toMatchObject({
      code: ErrorCode.InternalError,
      message: 'Iceberg catalog returned an empty response body',
      originalError: expect.objectContaining({
        message: 'Empty Iceberg loadTable response body',
      }),
    } satisfies Partial<StorageBackendError>)
  })

  it('rejects malformed JSON successful responses with a specific internal error', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('{', { status: 200, headers: { 'Content-Type': 'application/json' } })
    )
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    await expect(client.getConfig({ warehouse: 'wh' })).rejects.toMatchObject({
      code: ErrorCode.InternalError,
      message: 'Invalid JSON response from Iceberg catalog',
      originalError: expect.any(SyntaxError),
    } satisfies Partial<StorageBackendError>)
  })

  it('translates Iceberg JSON errors from non-2xx responses', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            message: 'table already exists',
            type: IcebergErrorType.AlreadyExistsException,
            code: 409,
          },
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      )
    )
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    await expect(
      client.createNamespace({ warehouse: 'wh', namespace: ['ns'] })
    ).rejects.toMatchObject({
      code: 409,
      message: 'table already exists',
      type: IcebergErrorType.AlreadyExistsException,
    } satisfies Partial<IcebergError>)
  })

  it('uses resource-specific messages for status-only conflict responses', async () => {
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    fetchMock.mockResolvedValueOnce(new Response('conflict', { status: 409 }))
    await expect(
      client.createNamespace({ warehouse: 'wh', namespace: ['ns'] })
    ).rejects.toMatchObject({
      code: 409,
      message: 'Namespace already exists',
      type: IcebergErrorType.AlreadyExistsException,
    } satisfies Partial<IcebergError>)

    fetchMock.mockResolvedValueOnce(new Response('conflict', { status: 409 }))
    await expect(
      client.createTable({
        warehouse: 'wh',
        namespace: 'ns',
        name: 'tbl',
        schema: { type: 'struct', fields: [] },
        spec: { fields: [] },
      })
    ).rejects.toMatchObject({
      code: 409,
      message: 'Table already exists',
      type: IcebergErrorType.AlreadyExistsException,
    } satisfies Partial<IcebergError>)
  })

  it('maps non-JSON error responses by HTTP status', async () => {
    fetchMock.mockResolvedValueOnce(new Response('missing', { status: 404 }))
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    await expect(
      client.loadNamespaceMetadata({ warehouse: 'wh', namespace: 'ns' })
    ).rejects.toMatchObject({
      code: 404,
      message: 'Namespace not found',
      type: IcebergErrorType.NoSuchNamespaceException,
    } satisfies Partial<IcebergError>)
  })

  it('maps empty 404 table responses to NoSuchTableException', async () => {
    const response = new Response(null, { status: 404 })
    const textSpy = vi.spyOn(response, 'text')
    fetchMock.mockResolvedValueOnce(response)
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    await expect(
      client.tableExists({ warehouse: 'wh', namespace: 'ns', table: 'tbl' })
    ).rejects.toMatchObject({
      code: 404,
      message: 'Table not found',
      type: IcebergErrorType.NoSuchTableException,
    } satisfies Partial<IcebergError>)
    expect(textSpy).not.toHaveBeenCalled()
  })

  it('does not read successful HEAD response bodies', async () => {
    const response = new Response(null, { status: 204 })
    const textSpy = vi.spyOn(response, 'text')
    fetchMock.mockResolvedValueOnce(response)
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    await expect(
      client.tableExists({ warehouse: 'wh', namespace: 'ns', table: 'tbl' })
    ).resolves.toBeUndefined()
    expect(textSpy).not.toHaveBeenCalled()
  })

  it('falls back to status code mapping for 404 with empty JSON object body', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('{}', { status: 404, headers: { 'Content-Type': 'application/json' } })
    )
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    await expect(
      client.tableExists({ warehouse: 'wh', namespace: 'ns', table: 'tbl' })
    ).rejects.toMatchObject({
      code: 404,
      message: 'Table not found',
      type: IcebergErrorType.NoSuchTableException,
    } satisfies Partial<IcebergError>)
  })

  it('falls back to status code mapping for non-spec error envelopes', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'not found', detail: 'whatever' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    await expect(
      client.loadNamespaceMetadata({ warehouse: 'wh', namespace: 'ns' })
    ).rejects.toMatchObject({
      code: 404,
      message: 'Namespace not found',
      type: IcebergErrorType.NoSuchNamespaceException,
    } satisfies Partial<IcebergError>)
  })

  it('honors valid Iceberg error envelopes over the HTTP status', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            message: 'specific message from server',
            type: IcebergErrorType.NoSuchTableException,
            code: 404,
          },
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    )
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    await expect(
      client.loadTable({ warehouse: 'wh', namespace: 'ns', table: 'tbl' })
    ).rejects.toMatchObject({
      code: 404,
      message: 'specific message from server',
      type: IcebergErrorType.NoSuchTableException,
    } satisfies Partial<IcebergError>)
  })

  it('accepts stringified numeric codes in Iceberg error envelopes', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            message: 'string-coded table miss',
            type: IcebergErrorType.NoSuchTableException,
            code: '404',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    )
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    await expect(
      client.loadTable({ warehouse: 'wh', namespace: 'ns', table: 'tbl' })
    ).rejects.toMatchObject({
      code: 404,
      message: 'string-coded table miss',
      type: IcebergErrorType.NoSuchTableException,
    } satisfies Partial<IcebergError>)
  })

  it('falls back to 500 for empty string codes in Iceberg error envelopes', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            message: 'empty-coded server error',
            type: IcebergErrorType.InternalServerError,
            code: '',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    )
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    await expect(client.getConfig({ warehouse: 'wh' })).rejects.toMatchObject({
      code: 500,
      message: 'empty-coded server error',
      type: IcebergErrorType.InternalServerError,
    } satisfies Partial<IcebergError>)
  })

  it('maps 500 responses without spec error envelopes to InternalServerError', async () => {
    fetchMock.mockResolvedValueOnce(new Response('upstream exploded', { status: 500 }))
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    await expect(client.getConfig({ warehouse: 'wh' })).rejects.toMatchObject({
      code: 500,
      message: 'Internal server error',
      type: IcebergErrorType.InternalServerError,
    } satisfies Partial<IcebergError>)
  })

  it('maps 503 responses without spec error envelopes to SlowDownException', async () => {
    fetchMock.mockResolvedValueOnce(new Response('busy', { status: 503 }))
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    await expect(client.getConfig({ warehouse: 'wh' })).rejects.toMatchObject({
      code: 503,
      message: 'Service unavailable',
      type: IcebergErrorType.SlowDownException,
    } satisfies Partial<IcebergError>)
  })

  it('wraps auth strategy failures as internal storage errors', async () => {
    const failingAuth = {
      authorize: () => {
        throw new Error('credential provider failed')
      },
    }
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: failingAuth,
    })

    await expect(client.getConfig({ warehouse: 'wh' })).rejects.toMatchObject({
      code: ErrorCode.InternalError,
      message: 'Failed to authorize Iceberg catalog request',
      originalError: expect.objectContaining({ message: 'credential provider failed' }),
    } satisfies Partial<StorageBackendError>)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('wraps network failures as internal storage errors', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'))
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    await expect(client.getConfig({ warehouse: 'wh' })).rejects.toMatchObject({
      code: ErrorCode.InternalError,
      message: 'Network error reaching Iceberg catalog',
      originalError: expect.any(TypeError),
    } satisfies Partial<StorageBackendError>)
  })

  it('reports timeouts with a dedicated message while preserving the original error', async () => {
    fetchMock.mockRejectedValueOnce(new DOMException('The operation timed out', 'TimeoutError'))
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
      timeoutMs: 1,
    })

    await expect(client.getConfig({ warehouse: 'wh' })).rejects.toMatchObject({
      code: ErrorCode.InternalError,
      message: 'Iceberg catalog request timed out',
      originalError: expect.objectContaining({ name: 'TimeoutError' }),
    } satisfies Partial<StorageBackendError>)
  })

  it('reports a fired client timeout as timed out even when fetch rejects AbortError', async () => {
    const controller = new AbortController()
    controller.abort(new DOMException('The operation timed out', 'TimeoutError'))
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal)
    fetchMock.mockRejectedValueOnce(new DOMException('The operation was aborted', 'AbortError'))
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
      timeoutMs: 1,
    })

    await expect(client.getConfig({ warehouse: 'wh' })).rejects.toMatchObject({
      code: ErrorCode.InternalError,
      message: 'Iceberg catalog request timed out',
      originalError: expect.objectContaining({ name: 'AbortError' }),
    } satisfies Partial<StorageBackendError>)
  })

  it('reports user-aborted requests with an aborted message', async () => {
    fetchMock.mockRejectedValueOnce(new DOMException('The operation was aborted', 'AbortError'))
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
      timeoutMs: 1,
    })

    await expect(client.getConfig({ warehouse: 'wh' })).rejects.toMatchObject({
      code: ErrorCode.InternalError,
      message: 'Iceberg catalog request aborted',
      originalError: expect.objectContaining({ name: 'AbortError' }),
    } satisfies Partial<StorageBackendError>)
  })

  it('reports timed out response body reads as timed out', async () => {
    const controller = new AbortController()
    controller.abort(new DOMException('The operation timed out', 'TimeoutError'))
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: () => {
        throw new DOMException('The operation was aborted', 'AbortError')
      },
    } as unknown as Response)
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
      timeoutMs: 1,
    })

    await expect(client.getConfig({ warehouse: 'wh' })).rejects.toMatchObject({
      code: ErrorCode.InternalError,
      message: 'Iceberg catalog request timed out',
      originalError: expect.objectContaining({ name: 'AbortError' }),
    } satisfies Partial<StorageBackendError>)
  })

  it('wraps response body read failures as internal storage errors', async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error('body stream broken'))
      },
    })
    fetchMock.mockResolvedValueOnce(
      new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } })
    )
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    await expect(client.getConfig({ warehouse: 'wh' })).rejects.toMatchObject({
      code: ErrorCode.InternalError,
      message: 'Failed to read Iceberg catalog response',
      originalError: expect.objectContaining({ message: expect.stringContaining('body stream') }),
    } satisfies Partial<StorageBackendError>)
  })

  it('allows empty successful HEAD responses', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    const client = new RestCatalogClient({
      catalogUrl: 'https://host.example.com/v1',
      auth: new BearerTokenAuth({ token: 't' }),
    })

    await expect(
      client.tableExists({ warehouse: 'wh', namespace: 'ns', table: 'tbl' })
    ).resolves.toBeUndefined()

    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('HEAD')
  })
})
