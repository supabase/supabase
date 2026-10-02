import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { AddressInfo, Socket } from 'node:net'
import { ErrorCode, type StorageBackendError } from '@internal/errors'
import JSONBigint from 'json-bigint'
import { afterEach, describe, expect, it } from 'vitest'
import { BearerTokenAuth, RestCatalogClient, SignV4Auth } from './rest-catalog-client'

interface TestServer {
  close(): Promise<void>
  url: string
}

type RequestRecord = {
  body: string
  headers: IncomingMessage['headers']
  method?: string
  rawHeaders: string[]
  url?: string
}

const servers: TestServer[] = []

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()))
})

describe('RestCatalogClient HTTP contract', () => {
  it('preserves large integers when sending and parsing JSON bodies', async () => {
    const largeFieldId = JSONBigint.parse('9223372036854775807') as number
    let requestBody = ''
    const server = await startServer(async (req, res) => {
      requestBody = await readRequestBody(req)
      sendJson(res, {
        'metadata-location': 's3://warehouse/ns/table/metadata.json',
        metadata: {
          'current-snapshot-id': JSONBigint.parse('9223372036854775807'),
          'format-version': 2,
          'table-uuid': 'table-id',
        },
      })
    })

    const client = new RestCatalogClient({
      auth: new BearerTokenAuth({ token: 'token' }),
      catalogUrl: `${server.url}/v1`,
    })

    const response = await client.createTable({
      name: 'tbl',
      namespace: 'ns',
      schema: {
        fields: [
          {
            id: largeFieldId,
            name: 'id',
            required: true,
            type: 'long',
          },
        ],
        type: 'struct',
      },
      spec: { fields: [] },
      warehouse: 'wh',
    })

    expect(requestBody).toContain('"id":9223372036854775807')
    expect(String(response.metadata['current-snapshot-id'])).toBe('9223372036854775807')
  })

  it('reports timed out requests as timed out rather than aborted', async () => {
    const server = await startServer(() => {
      // Intentionally leave the response open until the client-side timeout aborts it.
    })
    const client = new RestCatalogClient({
      auth: new BearerTokenAuth({ token: 'token' }),
      catalogUrl: `${server.url}/v1`,
      timeoutMs: 100,
    })

    await expect(client.getConfig({ warehouse: 'wh' })).rejects.toMatchObject({
      code: ErrorCode.InternalError,
      message: 'Iceberg catalog request timed out',
    } satisfies Partial<StorageBackendError>)
  })

  it('rejects successful non-JSON responses', async () => {
    const server = await startServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end('ok')
    })
    const client = new RestCatalogClient({
      auth: new BearerTokenAuth({ token: 'token' }),
      catalogUrl: `${server.url}/v1`,
    })

    await expect(client.getConfig({ warehouse: 'wh' })).rejects.toMatchObject({
      code: ErrorCode.InternalError,
      message: 'Unexpected non-JSON response from Iceberg catalog',
      originalError: expect.objectContaining({
        message: 'Unexpected Content-Type: text/plain',
      }),
    } satisfies Partial<StorageBackendError>)
  })

  it('sends one real SigV4 authorization header through fetch', async () => {
    const requests: RequestRecord[] = []
    const server = await startServer(async (req, res) => {
      requests.push({
        body: await readRequestBody(req),
        headers: req.headers,
        method: req.method,
        rawHeaders: req.rawHeaders,
        url: req.url,
      })
      sendJson(res, { defaults: {} })
    })
    const client = new RestCatalogClient({
      auth: new SignV4Auth({
        credentials: {
          accessKeyId: 'AKIDEXAMPLE',
          secretAccessKey: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
        },
        region: 'us-east-1',
      }),
      catalogUrl: `${server.url}/v1`,
    })

    await client.getConfig({ warehouse: 'wh' })

    expect(requests).toHaveLength(1)
    const request = requests[0]
    expect(request.headers.authorization).toContain('AWS4-HMAC-SHA256')
    expect(request.headers['x-amz-date']).toMatch(/^\d{8}T\d{6}Z$/)
    expect(countRawHeader(request.rawHeaders, 'authorization')).toBe(1)
    expect(countRawHeader(request.rawHeaders, 'x-amz-date')).toBe(1)
    expect(countRawHeader(request.rawHeaders, 'host')).toBe(1)
  })
})

async function startServer(
  handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
): Promise<TestServer> {
  const sockets = new Set<Socket>()
  const server = createServer((req, res) => {
    void Promise.resolve(handler(req, res)).catch((error) => {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: String(error) }))
    })
  })

  server.on('connection', (socket) => {
    sockets.add(socket)
    socket.once('close', () => sockets.delete(socket))
  })

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve)
  })

  const address = server.address() as AddressInfo
  const testServer = {
    close: async () => {
      for (const socket of sockets) {
        socket.destroy()
      }
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
        })
      })
    },
    url: `http://127.0.0.1:${address.port}`,
  }
  servers.push(testServer)
  return testServer
}

async function readRequestBody(req: IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString('utf8')
}

function sendJson(res: ServerResponse, body: unknown) {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSONBigint.stringify(body))
}

function countRawHeader(rawHeaders: string[], header: string) {
  let count = 0
  for (let index = 0; index < rawHeaders.length; index += 2) {
    if (rawHeaders[index].toLowerCase() === header) {
      count++
    }
  }
  return count
}
