const {
  mockGetTenantConfig,
  mockLoggerDebug,
  mockLoggerError,
  mockLogEvent,
  mockRunMigrationsOnTenant,
} = vi.hoisted(() => ({
  mockGetTenantConfig: vi.fn(),
  mockLoggerDebug: vi.fn(),
  mockLoggerError: vi.fn(),
  mockLogEvent: vi.fn(),
  mockRunMigrationsOnTenant: vi.fn(),
}))

vi.mock('@internal/database', () => ({
  getTenantConfig: mockGetTenantConfig,
}))

vi.mock('@internal/database/migrations', () => ({
  runMigrationsOnTenant: mockRunMigrationsOnTenant,
}))

vi.mock('@internal/monitoring', () => ({
  logger: {
    debug: mockLoggerDebug,
    error: mockLoggerError,
  },
  logSchema: {
    event: mockLogEvent,
  },
}))

vi.mock('../storage/events/base-event', () => ({
  BaseEvent: class {},
}))

function makePayload() {
  return {
    event: {
      $version: 'v1',
      type: 'ObjectCreated:Post',
      region: 'local',
      applyTime: 1,
      payload: {
        bucketId: 'bucket-a',
        name: 'path/file.png',
        reqId: 'req-123',
        sbReqId: 'sb-req-123',
      },
    },
    sentAt: '2026-04-23T00:00:00.000Z',
    tenant: {
      ref: 'tenant-a',
      host: 'local.test',
    },
  }
}

function makeJob() {
  return {
    id: 'job-1',
    data: makePayload(),
  }
}

async function loadWebhookModule() {
  vi.resetModules()

  const configModule = await import('../config')
  configModule.getConfig({ reload: true })
  configModule.mergeConfig({
    isMultitenant: true,
    webhookURL: 'https://example.com/webhook',
    webhookQueuePullInterval: 1000,
    webhookMaxConnections: 10,
    webhookQueueMaxFreeSockets: 2,
  })

  return import('../storage/events/lifecycle/webhook')
}

describe('Webhook queue handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetTenantConfig.mockResolvedValue({ disableEvents: [] })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('skips sends when the tenant disables a specific webhook target', async () => {
    const { Webhook } = await loadWebhookModule()
    const payload = makePayload()

    mockGetTenantConfig.mockResolvedValue({
      disableEvents: ['Webhook:ObjectCreated:Post:bucket-a/path/file.png'],
    })

    await expect(Webhook.shouldSend(payload)).resolves.toBe(false)
    expect(mockGetTenantConfig).toHaveBeenCalledWith('tenant-a')
  })

  it('posts webhook payloads with fetch and preserves headers/body', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        status: 204,
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const { Webhook } = await loadWebhookModule()

    await expect(Webhook.handle(makeJob() as never)).resolves.toEqual(makeJob())

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/webhook',
      expect.objectContaining({
        body: expect.any(String),
        dispatcher: expect.anything(),
        headers: expect.any(Headers),
        method: 'POST',
        signal: expect.anything(),
      })
    )

    const [, init] = fetchMock.mock.calls[0]
    const headers = init?.headers as Headers
    const body = JSON.parse(init?.body as string)

    expect(headers.get('content-type')).toBe('application/json')
    expect(headers.get('authorization')).toBeNull()
    expect(body).toEqual({
      type: 'Webhook',
      event: makePayload().event,
      sentAt: expect.any(String),
      tenant: makePayload().tenant,
    })
  })

  it('fails the job on non-2xx webhook responses', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('upstream failure', {
        status: 500,
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const { Webhook } = await loadWebhookModule()

    await expect(Webhook.handle(makeJob() as never)).rejects.toThrow(
      'Failed to send webhook for event ObjectCreated:Post to https://example.com/webhook: Request failed with status code 500'
    )

    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Request failed with status code 500',
        tenantId: 'tenant-a',
        reqId: 'req-123',
        sbReqId: 'sb-req-123',
      }),
      '[Lifecycle]: ObjectCreated:Post tenant-a/bucket-a/path/file.png - FAILED'
    )
  })

  it('wraps webhook timeout failures with event context', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValue(
        new DOMException('The operation was aborted due to timeout', 'TimeoutError')
      )
    vi.stubGlobal('fetch', fetchMock)

    const { Webhook } = await loadWebhookModule()

    await expect(Webhook.handle(makeJob() as never)).rejects.toThrow(
      'Failed to send webhook for event ObjectCreated:Post to https://example.com/webhook: timeout of 6000ms exceeded'
    )

    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.anything(),
      '[Lifecycle]: ObjectCreated:Post tenant-a/bucket-a/path/file.png',
      expect.objectContaining({
        tenantId: 'tenant-a',
        reqId: 'req-123',
        sbReqId: 'sb-req-123',
      })
    )
    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'timeout of 6000ms exceeded',
        tenantId: 'tenant-a',
        reqId: 'req-123',
        sbReqId: 'sb-req-123',
      }),
      '[Lifecycle]: ObjectCreated:Post tenant-a/bucket-a/path/file.png - FAILED'
    )
  })

  it('should handle database errors gracefully', async () => {
    const dbError = new Error('Database connection failed')
    mockGetTenantConfig.mockRejectedValue(dbError)

    await expect(mockGetTenantConfig('test-tenant')).rejects.toThrow('Database connection failed')
  })

  it('should handle migration errors gracefully', async () => {
    const migrationError = new Error('Migration failed')
    mockRunMigrationsOnTenant.mockRejectedValue(migrationError)

    await expect(
      mockRunMigrationsOnTenant({
        databaseUrl: 'postgres://test:test@localhost:5432/test',
        tenantId: 'test-tenant',
      })
    ).rejects.toThrow('Migration failed')
  })
})
