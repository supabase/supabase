import { API_URL } from 'lib/constants'
import { HttpResponse, http } from 'msw'

const PROJECT_REF = 'default'

export const APIMock = [
  http.get(`${API_URL}/msw/test`, () => {
    return HttpResponse.json({ message: 'Hello from MSW!' })
  }),
  http.get(`${API_URL}/platform/projects/${PROJECT_REF}/analytics/endpoints/logs.all`, () => {
    return HttpResponse.json({
      totalRequests: [
        {
          count: 12,
          timestamp: '2024-05-13T20:00:00.000Z',
        },
      ],
      errorCounts: [],
      responseSpeed: [
        {
          avg: 1017.0000000000001,
          timestamp: '2024-05-13T20:00:00',
        },
      ],
      topRoutes: [
        {
          count: 6,
          method: 'GET',
          path: '/auth/v1/user',
          search: null,
          status_code: 200,
        },
        {
          count: 4,
          method: 'GET',
          path: '/rest/v1/',
          search: null,
          status_code: 200,
        },
        {
          count: 2,
          method: 'HEAD',
          path: '/rest/v1/',
          search: null,
          status_code: 200,
        },
      ],
      topErrorRoutes: [],
      topSlowRoutes: [
        {
          avg: 1093.5,
          count: 4,
          method: 'GET',
          path: '/rest/v1/',
          search: null,
          status_code: 200,
        },
        {
          avg: 1037.5,
          count: 2,
          method: 'HEAD',
          path: '/rest/v1/',
          search: null,
          status_code: 200,
        },
        {
          avg: 959.1666666666667,
          count: 6,
          method: 'GET',
          path: '/auth/v1/health',
          search: null,
          status_code: 200,
        },
      ],
      networkTraffic: [
        {
          egress_mb: 0.000666,
          ingress_mb: 0,
          timestamp: '2024-05-13T20:00:00.000Z',
        },
      ],
    })
  }),
]
