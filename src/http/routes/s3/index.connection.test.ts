import { createConnection } from 'node:net'
import Fastify from 'fastify'
import { setErrorHandler } from '../../error-handler'
import { closeConnectionOnError } from '../../plugins/close-connection'
import s3Routes from './index'

vi.mock('../../plugins', async () => {
  const { default: fp } = await import('fastify-plugin')
  const { xmlParser } = await import('../../plugins/xml')
  const noop = fp(async () => {})
  return {
    db: noop,
    detectS3IcebergBucket: noop,
    icebergRestCatalog: noop,
    requireTenantFeature: () => noop,
    signatureV4: noop,
    storage: noop,
    xmlParser,
  }
})

vi.mock('./router', () => ({
  findArraySchemaPaths: () => [],
  getRouter: () => ({
    routes: () =>
      new Map([
        [
          '/bucket/key',
          [
            {
              method: 'put',
              schema: {},
              matches: () => true,
              validate: () => true,
              disableContentTypeParser: true,
              handler: async () => {
                throw new Error('controlled pre-body S3 handler failure')
              },
            },
          ],
        ],
      ]),
  }),
}))

it('uses one fallback and clears it when the error connection closes', async () => {
  const app = Fastify()
  await app.register(closeConnectionOnError)
  setErrorHandler(app)
  let initialListeners = 0
  let addedListeners = 0
  app.addHook('onRequest', async (_request, reply) => {
    initialListeners = reply.raw.listenerCount('finish')
  })
  app.addHook('onSend', async (_request, reply, payload) => {
    addedListeners = reply.raw.listenerCount('finish') - initialListeners
    return payload
  })
  await app.register(s3Routes)
  const address = await app.listen({ host: '127.0.0.1', port: 0 })
  const spy = vi.spyOn(globalThis, 'setTimeout')
  const clear = vi.spyOn(globalThis, 'clearTimeout')
  const client = createConnection({ host: '127.0.0.1', port: Number(new URL(address).port) })
  let response = ''
  let timers: NodeJS.Timeout[] = []
  try {
    await new Promise<void>((resolve, reject) => {
      client.setEncoding('utf8')
      client.on('data', (chunk) => {
        response += chunk
      })
      client.on('error', reject)
      client.on('close', () => resolve())
      client.setTimeout(4000, () => client.destroy(new Error('S3 timer probe timed out')))
      client.write(
        'PUT /bucket/key HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/xml\r\nContent-Length: 100000\r\n\r\npartial'
      )
    })
    timers = spy.mock.calls.flatMap((args, index) =>
      args[1] === 3000 ? [spy.mock.results[index].value as NodeJS.Timeout] : []
    )
    expect(response).toContain('HTTP/1.1 500')
    expect(response).toMatch(/connection: close/i)
    expect(addedListeners).toBe(1)
    expect(timers).toHaveLength(1)
    await vi.waitFor(() => expect(clear).toHaveBeenCalledWith(timers[0]))
    expect(timers[0].hasRef()).toBe(false)
  } finally {
    for (const timer of timers) clearTimeout(timer)
    spy.mockRestore()
    clear.mockRestore()
    client.destroy()
    await app.close()
  }
})
