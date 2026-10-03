import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { defaultPreparePayloadMock } = vi.hoisted(() => ({
  defaultPreparePayloadMock: vi.fn(),
}))

vi.mock('pino-logflare', () => ({
  defaultPreparePayload: defaultPreparePayloadMock,
}))

type PayloadMeta = Parameters<typeof defaultPreparePayloadMock>[1]

describe('logflare helpers', () => {
  beforeEach(() => {
    defaultPreparePayloadMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('promotes project, sbReqId, traceId, and spanId onto the prepared payload', async () => {
    defaultPreparePayloadMock.mockReturnValue({
      log_entry: 'hello',
      metadata: { level: 'info' },
    })

    const { onPreparePayload } = await import('./logflare')
    const meta = {} as PayloadMeta
    const payload = {
      project: 'tenant-a',
      sbReqId: 'sb-req-123',
      traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
      spanId: '00f067aa0ba902b7',
      msg: { text: 'hello' },
    }

    expect(onPreparePayload(payload, meta)).toEqual({
      log_entry: 'hello',
      metadata: { level: 'info' },
      project: 'tenant-a',
      request_id: 'sb-req-123',
      trace_id: '4bf92f3577b34da6a3ce929d0e0e4736',
      span_id: '00f067aa0ba902b7',
    })
    expect(defaultPreparePayloadMock).toHaveBeenCalledWith(payload, meta)
  })

  it('leaves project, request_id, trace_id, and span_id undefined when they are missing', async () => {
    defaultPreparePayloadMock.mockReturnValue({
      log_entry: 'hello',
      metadata: {},
    })

    const { onPreparePayload } = await import('./logflare')
    const payload = {
      msg: { text: 'hello' },
    }

    expect(onPreparePayload(payload, {} as PayloadMeta)).toEqual({
      log_entry: 'hello',
      metadata: {},
      project: undefined,
      request_id: undefined,
      trace_id: undefined,
      span_id: undefined,
    })
  })

  it('logs transport errors to console.error', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { onError } = await import('./logflare')
    const err = new Error('boom')
    err.stack = 'stack-trace'

    onError({}, err)

    expect(errorSpy).toHaveBeenCalledWith('[Logflare][Error] boom - stack-trace')
  })

  it('includes response diagnostics without logging the full batch', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { onError } = await import('./logflare')
    const err = Object.assign(new Error('boom'), {
      response: { status: 422 },
      data: { error: 'invalid payload' },
    })
    err.stack = 'stack-trace'

    onError(
      {
        batch: [
          { metadata: { context: { type: 'request' } }, sensitive: 'hidden' },
          { metadata: { context: { type: 'event' } } },
        ],
      },
      err
    )

    expect(errorSpy).toHaveBeenCalledWith(
      '[Logflare][Error] boom (status=422 data={"error":"invalid payload"} batchSize=2 batchTypes=request,event) - stack-trace'
    )
    expect(errorSpy.mock.calls[0]?.[0]).not.toContain('hidden')
  })

  it('does not throw when response diagnostics are not serializable', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { onError } = await import('./logflare')
    const data: { self?: unknown } = {}
    data.self = data
    const err = Object.assign(new Error('boom'), {
      response: { status: 422 },
      data,
    })
    err.stack = 'stack-trace'

    expect(() => onError({}, err)).not.toThrow()
    expect(errorSpy).toHaveBeenCalledWith(
      '[Logflare][Error] boom (status=422 data=[unserializable]) - stack-trace'
    )
  })
})
