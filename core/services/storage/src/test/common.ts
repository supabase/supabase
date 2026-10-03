import { Queue } from '@internal/queue'
import type { FastifyInstance } from 'fastify'
import path from 'path'
import { S3Backend } from '../storage/backend'

const ENV = { ...process.env }
const projectRoot = path.join(__dirname, '..', '..')

let sharedAdminAppPromise: Promise<FastifyInstance> | undefined

export async function createAdminApp(): Promise<FastifyInstance> {
  const { default: app } = await import('../admin-app')
  return app({})
}

async function getSharedAdminApp() {
  if (!sharedAdminAppPromise) {
    const appPromise = createAdminApp()
    sharedAdminAppPromise = appPromise.catch((error) => {
      if (sharedAdminAppPromise === appPromise) {
        sharedAdminAppPromise = undefined
      }

      throw error
    })
  }

  return sharedAdminAppPromise
}

type SharedAdminApp = Pick<FastifyInstance, 'inject' | 'close'>

export const adminApp: SharedAdminApp = {
  inject: ((...args: Parameters<FastifyInstance['inject']>) =>
    getSharedAdminApp().then((app) => app.inject(...args))) as FastifyInstance['inject'],
  close: (async (...args: Parameters<FastifyInstance['close']>) => {
    if (!sharedAdminAppPromise) {
      return
    }

    const appPromise = sharedAdminAppPromise
    sharedAdminAppPromise = undefined
    const app = await appPromise

    return app.close(...args)
  }) as FastifyInstance['close'],
}

export function useMockQueue() {
  beforeEach(() => {
    mockQueue()
  })
}

export function mockQueue() {
  const sendSpy = vi.fn()
  const insertSpy = vi.fn()
  const queueSpy = vi.fn().mockReturnValue({
    send: sendSpy,
    insert: insertSpy,
  })
  vi.spyOn(Queue, 'getInstance').mockImplementation(queueSpy)

  return { queueSpy, sendSpy, insertSpy }
}

export function useMockObject() {
  beforeEach(() => {
    process.env = { ...ENV }

    vi.clearAllMocks()
    vi.spyOn(S3Backend.prototype, 'getObject').mockResolvedValue({
      metadata: {
        httpStatusCode: 200,
        size: 3746,
        mimetype: 'image/png',
        lastModified: new Date('Thu, 12 Aug 2021 16:00:00 GMT'),
        eTag: 'abc',
        cacheControl: 'no-cache',
        contentLength: 3746,
      },
      httpStatusCode: 200,
      body: Buffer.from(''),
    })

    vi.spyOn(S3Backend.prototype, 'uploadObject').mockResolvedValue({
      httpStatusCode: 200,
      size: 3746,
      mimetype: 'image/png',
      lastModified: new Date('Thu, 12 Aug 2021 16:00:00 GMT'),
      eTag: 'abc',
      cacheControl: 'no-cache',
      contentLength: 3746,
    })

    vi.spyOn(S3Backend.prototype, 'copyObject').mockResolvedValue({
      httpStatusCode: 200,
      lastModified: new Date('Thu, 12 Aug 2021 16:00:00 GMT'),
      eTag: 'abc',
    })

    vi.spyOn(S3Backend.prototype, 'deleteObject').mockResolvedValue()

    vi.spyOn(S3Backend.prototype, 'deleteObjects').mockResolvedValue()

    vi.spyOn(S3Backend.prototype, 'headObject').mockResolvedValue({
      httpStatusCode: 200,
      size: 3746,
      mimetype: 'image/png',
      eTag: 'abc',
      cacheControl: 'no-cache',
      lastModified: new Date('Wed, 12 Oct 2022 11:17:02 GMT'),
      contentLength: 3746,
    })

    vi.spyOn(S3Backend.prototype, 'privateAssetUrl').mockResolvedValue(
      `local:///${projectRoot}/data/sadcat.jpg`
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
  })
}
