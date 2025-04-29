import { HttpResponse, http } from 'msw'
import { API_LOGS_MOCK } from './logs'

const API_URL = 'http://localhost:3000/api'

export const APIMock = [
  http.get(`/api/msw/test`, () => {
    return HttpResponse.json({ message: 'Hello from MSW!' })
  }),
  http.get(`${API_URL}/platform/projects/default/analytics/endpoints/logs.all`, () => {
    return HttpResponse.json(API_LOGS_MOCK)
  }),
  http.get(`${API_URL}/platform/projects/default/databases`, () => {
    return HttpResponse.json([
      {
        cloud_provider: 'AWS',
        connectionString: '123',
        connection_string_read_only: '123',
        db_host: '123',
        db_name: 'postgres',
        db_port: 5432,
        identifier: 'zfbgmottajndcknalagu',
        inserted_at: '2025-02-16T22:24:42.115195',
        region: 'us-east-1',
        restUrl: 'https://zfbgmottajndcknalagu.supabase.co',
        size: 't4g.nano',
        status: 'ACTIVE_HEALTHY',
      },
    ])
  }),

  // MUST BE LAST HANDLER ON LIST
  http.all('*', ({ request }) => {
    console.warn('🚫 [MSW] Unhandled request:', request.method, request.url)
    return HttpResponse.json({ message: '🚫 MSW missed' }, { status: 500 })
  }),
]
