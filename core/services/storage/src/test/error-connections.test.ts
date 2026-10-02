import { Agent, request as httpRequest } from 'node:http'
import { createConnection } from 'node:net'
import { text } from 'node:stream/consumers'
import adminApp from '../admin-app'
import app from '../app'
import { getConfig } from '../config'

describe('direct error response connections', () => {
  const storage = app()
  const admin = adminApp()
  let ports: { storage: number; admin: number }
  let authorization: string

  beforeAll(async () => {
    const storageAddress = await storage.listen({ host: '127.0.0.1', port: 0 })
    const adminAddress = await admin.listen({ host: '127.0.0.1', port: 0 })
    ports = {
      storage: Number(new URL(storageAddress).port),
      admin: Number(new URL(adminAddress).port),
    }
    authorization = `Bearer ${await getConfig().serviceKeyAsync}`
  })

  afterAll(async () => {
    await storage.close()
    await admin.close()
  })

  describe.each([
    {
      name: 'REST not found',
      server: 'storage',
      path: '/object/not-a-route',
      status: 404,
      headers: {},
    },
    {
      name: 'TUS missing version',
      server: 'storage',
      path: '/upload/resumable/',
      status: 412,
      headers: { 'upload-length': '100000' },
    },
    {
      name: 'TUS invalid header',
      server: 'storage',
      path: '/upload/resumable/',
      status: 400,
      headers: { 'tus-resumable': '1.0.0', 'upload-length': 'invalid' },
    },
    {
      name: 'admin missing API key',
      server: 'admin',
      path: '/tenants/some-id',
      status: 401,
      headers: {},
    },
  ] as const)('$name', ({ server, path, status, headers }) => {
    it.each(['content-length', 'chunked'])('closes an incomplete %s body', async (framing) => {
      const client = createConnection({ host: '127.0.0.1', port: ports[server] })
      let response = ''
      let closed = false
      try {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(resolve, 2000)
          const finish = () => {
            clearTimeout(timeout)
            resolve()
          }
          client.setEncoding('utf8')
          client.on('data', (chunk) => {
            response += chunk
          })
          client.on('end', () => {
            closed = true
            finish()
          })
          client.on('error', (error) => {
            clearTimeout(timeout)
            reject(error)
          })
          client.write(
            [
              `POST ${path} HTTP/1.1`,
              'Host: localhost',
              'Content-Type: application/offset+octet-stream',
              `Authorization: ${authorization}`,
              ...Object.entries(headers).map(([name, value]) => `${name}: ${value}`),
              framing === 'chunked' ? 'Transfer-Encoding: chunked' : 'Content-Length: 100000',
              '',
              framing === 'chunked' ? '4\r\nbody\r\n' : 'body',
            ].join('\r\n')
          )
        })
        expect(response).toMatch(new RegExp(`^HTTP/1.1 ${status} `))
        expect(response).toMatch(/\r\nconnection: close\r\n/i)
        expect(closed).toBe(true)
        const separator = response.indexOf('\r\n\r\n')
        const head = response.slice(0, separator)
        const body = response.slice(separator + 4)
        const length = head.match(/\r\ncontent-length: (\d+)/i)
        expect(length).not.toBeNull()
        expect(Buffer.byteLength(body)).toBe(Number(length?.[1]))
      } finally {
        client.destroy()
      }
    })

    it('preserves the connection without a request body', async () => {
      const agent = new Agent({ keepAlive: true })
      const send = (method: string, url: string) =>
        new Promise<{
          status?: number
          connection?: string
          reused: boolean
        }>((resolve, reject) => {
          const request = httpRequest(
            {
              host: '127.0.0.1',
              port: ports[server],
              method,
              path: url,
              agent,
              headers: { ...headers, authorization },
            },
            (response) => {
              text(response).then(
                () =>
                  resolve({
                    status: response.statusCode,
                    connection: response.headers.connection,
                    reused: request.reusedSocket,
                  }),
                reject
              )
            }
          )
          request.on('error', reject)
          request.setTimeout(2000, () => request.destroy(new Error('response timeout')))
          request.end()
        })
      try {
        expect(await send('POST', path)).toMatchObject({ status, connection: 'keep-alive' })
        expect(await send('GET', '/status')).toMatchObject({ status: 200, reused: true })
      } finally {
        agent.destroy()
      }
    })
  })
})
