import { API_URL } from 'lib/constants'
import { HttpResponse, http } from 'msw'

export const GlobalAPIMocks = [
  http.get(`${API_URL}/msw/test`, () => {
    return HttpResponse.json({ message: 'Hello from MSW!' })
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
        identifier: 'default',
        inserted_at: '2025-02-16T22:24:42.115195',
        region: 'us-east-1',
        restUrl: 'https://default.supabase.co',
        size: 't4g.nano',
        status: 'ACTIVE_HEALTHY',
      },
    ])
  }),
]
