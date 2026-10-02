import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import app from '../app'
import { getConfig } from '../config'

const { serviceKeyAsync } = getConfig()

describe('search filter wildcard escaping', () => {
  let appInstance: FastifyInstance
  let serviceKey: string

  beforeAll(async () => {
    serviceKey = await serviceKeyAsync
    appInstance = app()
  })

  afterAll(async () => {
    await appInstance.close()
  })

  test('bucket search should treat % as a literal character', async () => {
    const response = await appInstance.inject({
      method: 'GET',
      url: '/bucket?search=%25',
      headers: {
        authorization: `Bearer ${serviceKey}`,
      },
    })

    expect(response.statusCode).toBe(200)
    const buckets = response.json<{ name: string }[]>()
    expect(buckets).toHaveLength(0)
  })

  test('bucket search should treat _ as a literal character', async () => {
    const runId = randomUUID().slice(0, 8)
    const literalMatch = `escwild_${runId}`
    const wildcardOnlyMatch = `escwildX${runId}`

    const createBucket = async (name: string) =>
      appInstance.inject({
        method: 'POST',
        url: '/bucket',
        headers: {
          authorization: `Bearer ${serviceKey}`,
        },
        payload: { name },
      })

    const deleteBucket = async (name: string) =>
      appInstance.inject({
        method: 'DELETE',
        url: `/bucket/${name}`,
        headers: {
          authorization: `Bearer ${serviceKey}`,
        },
      })

    await createBucket(literalMatch)
    await createBucket(wildcardOnlyMatch)

    try {
      const response = await appInstance.inject({
        method: 'GET',
        url: `/bucket?search=${encodeURIComponent(`escwild_${runId}`)}`,
        headers: {
          authorization: `Bearer ${serviceKey}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const names = response.json<{ name: string }[]>().map((bucket) => bucket.name)
      expect(names).toContain(literalMatch)
      expect(names).not.toContain(wildcardOnlyMatch)
    } finally {
      await deleteBucket(literalMatch)
      await deleteBucket(wildcardOnlyMatch)
    }
  })

  test('analytics bucket search should treat % as a literal character', async () => {
    const response = await appInstance.inject({
      method: 'GET',
      url: '/iceberg/bucket?search=%25',
      headers: {
        authorization: `Bearer ${serviceKey}`,
      },
    })

    expect(response.statusCode).toBe(200)
    const buckets = response.json<{ name: string }[]>()
    expect(buckets).toHaveLength(0)
  })

  test('analytics bucket search should treat _ as a literal character', async () => {
    const runId = randomUUID().slice(0, 8)
    const literalMatch = `icewild_${runId}`
    const wildcardOnlyMatch = `icewildX${runId}`

    const createBucket = async (name: string) =>
      appInstance.inject({
        method: 'POST',
        url: '/iceberg/bucket',
        headers: {
          authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        payload: { name },
      })

    const deleteBucket = async (name: string) =>
      appInstance.inject({
        method: 'DELETE',
        url: `/iceberg/bucket/${name}`,
        headers: {
          authorization: `Bearer ${serviceKey}`,
        },
      })

    await createBucket(literalMatch)
    await createBucket(wildcardOnlyMatch)

    try {
      const response = await appInstance.inject({
        method: 'GET',
        url: `/iceberg/bucket?search=${encodeURIComponent(`icewild_${runId}`)}`,
        headers: {
          authorization: `Bearer ${serviceKey}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const names = response.json<{ name: string }[]>().map((bucket) => bucket.name)
      expect(names).toContain(literalMatch)
      expect(names).not.toContain(wildcardOnlyMatch)
    } finally {
      await deleteBucket(literalMatch)
      await deleteBucket(wildcardOnlyMatch)
    }
  })
})
