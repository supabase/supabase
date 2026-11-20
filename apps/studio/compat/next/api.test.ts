import type { NextApiRequest, NextApiResponse } from 'next'
import { describe, expect, it, vi } from 'vitest'

import { toWebHandler } from './api'

const createRequest = (body?: string, contentType = 'application/json') =>
  new Request('http://localhost/api/test', {
    method: 'POST',
    headers: { 'content-type': contentType },
    body,
  })

describe('toWebHandler request parsing', () => {
  it.each(
    ['application/json', 'application/ld+json', 'Application/JSON; charset=utf-8'].flatMap(
      (contentType) =>
        ['{', '[1,', 'undefined', '   ', '{"private":"value",}'].map((body) => ({
          contentType,
          body,
        }))
    )
  )(
    'returns 400 without calling the handler for malformed $contentType: $body',
    async ({ body, contentType }) => {
      const handler = vi.fn()
      const response = await toWebHandler(handler)({ request: createRequest(body, contentType) })

      expect(response.status).toBe(400)
      expect(await response.text()).toBe('Invalid JSON')
      expect(handler).not.toHaveBeenCalled()
    }
  )

  it.each<[string | undefined, unknown]>([
    ['{"query":"select 1"}', { query: 'select 1' }],
    ['[1,"two",null]', [1, 'two', null]],
    ['"hello"', 'hello'],
    ['42', 42],
    ['true', true],
    ['false', false],
    ['null', null],
    ['', {}],
    [undefined, {}],
  ])('passes valid JSON %s to the handler', async (body, expected) => {
    const handler = vi.fn((req: NextApiRequest, res: NextApiResponse) => {
      expect(req.body).toEqual(expected)
      res.status(201).setHeader('x-handler', 'called')
      res.json({ success: true })
    })

    const response = await toWebHandler(handler)({ request: createRequest(body) })

    expect(handler).toHaveBeenCalledOnce()
    expect(response.status).toBe(201)
    expect(response.headers.get('x-handler')).toBe('called')
    expect(response.headers.get('content-type')).toBe('application/json')
    expect(await response.json()).toEqual({ success: true })
  })

  it.each(['application/json; charset=utf-8', 'application/ld+json', 'Application/JSON'])(
    'accepts JSON content type %s',
    async (contentType) => {
      const handler = vi.fn((req: NextApiRequest, res: NextApiResponse) => res.json(req.body))
      const response = await toWebHandler(handler)({
        request: createRequest('{"name":"café"}', contentType),
      })

      expect(await response.json()).toEqual({ name: 'café' })
    }
  )

  it.each<[string, string, unknown]>([
    [
      'name=hello+world&value=%26%3D',
      'application/x-www-form-urlencoded',
      {
        name: 'hello world',
        value: '&=',
      },
    ],
    ['{', 'text/plain', '{'],
    ['{', 'text/plain; note="application/json"', '{'],
    ['{', 'application/jsonx', '{'],
  ])('preserves non-JSON request bodies', async (body, contentType, expected) => {
    const handler = vi.fn((req: NextApiRequest, res: NextApiResponse) => {
      expect(req.body).toEqual(expected)
      res.end('ok')
    })

    const response = await toWebHandler(handler)({ request: createRequest(body, contentType) })

    expect(handler).toHaveBeenCalledOnce()
    expect(await response.text()).toBe('ok')
  })

  it.each(['GET', 'HEAD'])('leaves %s bodies undefined', async (method) => {
    const handler = vi.fn((req: NextApiRequest, res: NextApiResponse) => {
      expect(req.method).toBe(method)
      expect(req.body).toBeUndefined()
      res.end()
    })

    await toWebHandler(handler)({
      request: new Request('http://localhost/api/test', {
        method,
        headers: { 'content-type': 'application/json' },
      }),
    })

    expect(handler).toHaveBeenCalledOnce()
  })

  it('preserves the URL, headers and route parameter precedence', async () => {
    const handler = vi.fn((req: NextApiRequest, res: NextApiResponse) => {
      expect(req.url).toBe('/api/test?ref=search&tag=one&tag=two&empty=')
      expect(req.headers['x-custom']).toBe('value')
      expect(req.query).toEqual({ ref: 'route', tag: ['one', 'two'], empty: '' })
      res.end('ok')
    })

    await toWebHandler(handler)({
      request: new Request('http://localhost/api/test?ref=search&tag=one&tag=two&empty=', {
        headers: { 'X-Custom': 'value' },
      }),
      params: { ref: 'route', omitted: undefined },
    })

    expect(handler).toHaveBeenCalledOnce()
  })

  it.each(['%', '%ZZ', '%E0%A4%A', '%FF'])(
    'preserves undecodable cookie values: %s',
    async (bad) => {
      const handler = vi.fn((req: NextApiRequest, res: NextApiResponse) => {
        expect(req.cookies).toEqual({ bad, good: 'hello world', token: 'a=b', empty: '' })
        res.json({ success: true })
      })

      const response = await toWebHandler(handler)({
        request: new Request('http://localhost/api/test', {
          headers: { cookie: `bad=${bad}; good=hello%20world; token=a=b; empty=` },
        }),
      })

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ success: true })
      expect(handler).toHaveBeenCalledOnce()
    }
  )

  it('does not hide a body-read failure as invalid JSON', async () => {
    const request = createRequest('{}')
    const error = new Error('Body read failed')
    vi.spyOn(request, 'text').mockRejectedValue(error)
    const handler = vi.fn()

    await expect(toWebHandler(handler)({ request })).rejects.toBe(error)
    expect(handler).not.toHaveBeenCalled()
  })

  it('does not turn a handler SyntaxError into a request parsing error', async () => {
    const error = new SyntaxError('Handler failed')
    const handler = vi.fn(() => {
      throw error
    })

    await expect(toWebHandler(handler)({ request: createRequest('{}') })).rejects.toBe(error)
    expect(handler).toHaveBeenCalledOnce()
  })

  it('passes through a Web Response returned by the handler', async () => {
    const expected = new Response('direct', { status: 202, headers: { 'x-direct': 'yes' } })

    const response = await toWebHandler(() => expected)({ request: createRequest('{}') })

    expect(response).toBe(expected)
    expect(await response.text()).toBe('direct')
  })

  it('keeps streamed responses open for chunks written after the handler returns', async () => {
    let finish: (() => void) | undefined
    const response = await toWebHandler((_req, res) => {
      res.writeHead(202, { 'content-type': 'text/event-stream', 'x-stream': 'yes' })
      res.write('first\n')
      finish = () => res.end('last\n')
    })({ request: createRequest('{}') })

    expect(response.status).toBe(202)
    expect(response.headers.get('x-stream')).toBe('yes')
    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    expect(decoder.decode((await reader.read()).value)).toBe('first\n')
    finish!()
    expect(decoder.decode((await reader.read()).value)).toBe('last\n')
    expect((await reader.read()).done).toBe(true)
  })

  it('preserves close and aborted events from the request signal', async () => {
    const controller = new AbortController()
    const onClose = vi.fn()
    const onAborted = vi.fn()
    await toWebHandler((req, res) => {
      req.on('close', onClose)
      req.once('aborted', onAborted)
      res.end('ok')
    })({ request: new Request('http://localhost/api/test', { signal: controller.signal }) })

    controller.abort()

    expect(onClose).toHaveBeenCalledOnce()
    expect(onAborted).toHaveBeenCalledOnce()
  })
})
