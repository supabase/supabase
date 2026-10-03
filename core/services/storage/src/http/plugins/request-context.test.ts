import Fastify, { FastifyInstance } from 'fastify'
import { requestContext } from './request-context'

describe('request-context plugin', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = Fastify()
    await app.register(requestContext)
  })

  afterEach(async () => {
    await app.close()
  })

  it('extracts sb-request-id from the header onto the request', async () => {
    app.get('/context', async (request) => ({ sbReqId: request.sbReqId }))

    const response = await app.inject({
      method: 'GET',
      url: '/context',
      headers: { 'sb-request-id': 'sb-req-123' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ sbReqId: 'sb-req-123' })
  })

  it('leaves sbReqId undefined when the header is absent', async () => {
    app.get('/context', async (request) => ({ sbReqId: request.sbReqId ?? null }))

    const response = await app.inject({ method: 'GET', url: '/context' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ sbReqId: null })
  })
})
