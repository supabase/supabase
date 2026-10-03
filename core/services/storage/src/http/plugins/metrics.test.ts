import * as monitoringMetrics from '@internal/monitoring/metrics'
import Fastify from 'fastify'
import { httpMetrics } from './metrics'

describe('httpMetrics plugin', () => {
  it('uses numeric monotonic timestamps for request duration metrics', async () => {
    const app = Fastify()
    const httpMetricsSpy = vi.spyOn(monitoringMetrics, 'recordHttpRequestMetrics')
    const performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(0)
    let metricsStartTime: unknown

    await app.register(httpMetrics())
    app.get('/objects/:bucket', async (request) => {
      metricsStartTime = request.metricsStartTime
      return 'ok'
    })

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/objects/bucket-a',
      })

      expect(response.statusCode).toBe(200)
      expect(metricsStartTime).toBe(0)
      expect(httpMetricsSpy).toHaveBeenCalledWith(0, undefined, 2, 'GET', 'unknown', 200)
    } finally {
      performanceNowSpy.mockRestore()
      httpMetricsSpy.mockRestore()
      await app.close()
    }
  })

  it('records HTTP metric attributes without tenant id labels', async () => {
    const app = Fastify()
    const httpMetricsSpy = vi.spyOn(monitoringMetrics, 'recordHttpRequestMetrics')

    app.decorateRequest('tenantId', 'tenant-a')
    await app.register(httpMetrics())
    app.post('/objects/:bucket', async (_request, reply) => {
      reply.header('content-length', '2')
      return 'ok'
    })

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/objects/bucket-a',
        headers: {
          'content-length': '7',
          'content-type': 'text/plain',
        },
        payload: 'payload',
      })

      expect(response.statusCode).toBe(200)

      expect(httpMetricsSpy).toHaveBeenCalledWith(expect.any(Number), 7, 2, 'POST', 'unknown', 200)
    } finally {
      httpMetricsSpy.mockRestore()
      await app.close()
    }
  })

  it('ignores malformed request content-length headers', async () => {
    const app = Fastify()
    const httpMetricsSpy = vi.spyOn(monitoringMetrics, 'recordHttpRequestMetrics')

    await app.register(httpMetrics())
    app.post('/objects/:bucket', async (_request, reply) => {
      reply.header('content-length', 'nope')
      return 'ok'
    })

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/objects/bucket-a',
        headers: {
          'content-length': 'not-a-size',
          'content-type': 'text/plain',
        },
        payload: 'payload',
      })

      expect(response.statusCode).toBe(200)
      expect(httpMetricsSpy).toHaveBeenCalledWith(
        expect.any(Number),
        undefined,
        2,
        'POST',
        'unknown',
        200
      )
    } finally {
      httpMetricsSpy.mockRestore()
      await app.close()
    }
  })
})
