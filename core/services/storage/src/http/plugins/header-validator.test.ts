import { StorageBackendError } from '@internal/errors'
import Fastify, { FastifyInstance } from 'fastify'
import { setErrorHandler } from '../error-handler'
import { closeConnectionOnError } from './close-connection'
import { headerValidator } from './header-validator'

describe('header-validator plugin', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = Fastify()
    await app.register(closeConnectionOnError)
    await app.register(headerValidator())
    setErrorHandler(app)
  })

  afterEach(async () => {
    await app.close()
  })

  it('should reject response with newline in header value', async () => {
    app.get('/test', async (_request, reply) => {
      reply.header('x-test', 'value\nwith\nnewlines')
      return { ok: true }
    })

    const response = await app.inject({ method: 'GET', url: '/test' })

    expect(response.statusCode).toBe(400)
    const body = response.json()
    expect(body.message).toContain('Invalid character in response header')
    expect(body.message).toContain('x-test')
  })

  it('should allow normal ASCII header values', async () => {
    app.get('/test', async (_request, reply) => {
      reply.header('x-transformations', 'width:100,height:200,resize:cover')
      return { ok: true }
    })

    const response = await app.inject({ method: 'GET', url: '/test' })

    expect(response.statusCode).toBe(200)
    expect(response.headers['x-transformations']).toBe('width:100,height:200,resize:cover')
  })

  it('should reject response with newline in array header value', async () => {
    app.get('/test', async (_request, reply) => {
      reply.header('x-test', ['blah', 'stuff', 'value\nwith\nnewlines', 'other'])
      return { ok: true }
    })

    const response = await app.inject({ method: 'GET', url: '/test' })

    expect(response.statusCode).toBe(400)
    const body = response.json()
    expect(body.message).toContain('Invalid character in response header')
    expect(body.message).toContain('x-test')
  })

  it('should allow normal ASCII array header values', async () => {
    app.get('/test', async (_request, reply) => {
      reply.header('x-transformations', ['width:100,height:200,resize:cover', 'blah', 'blah'])
      return { ok: true }
    })

    const response = await app.inject({ method: 'GET', url: '/test' })

    expect(response.statusCode).toBe(200)
    expect(response.headers['x-transformations']).toEqual([
      'width:100,height:200,resize:cover',
      'blah',
      'blah',
    ])
  })

  it('should close the connection when a renderable error requests it', async () => {
    app.get('/test-close-connection', async () => {
      throw StorageBackendError.fromError(new Error('socket hang up')).withConnectionClose()
    })

    const response = await app.inject({ method: 'GET', url: '/test-close-connection' })

    expect(response.statusCode).toBe(500)
    expect(response.headers.connection).toBe('close')
  })
})
