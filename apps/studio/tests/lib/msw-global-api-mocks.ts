import { http, HttpResponse } from 'msw'

import { API_URL } from '@/lib/constants'

export const GlobalAPIMocks = [
  http.get(`${API_URL}/msw/test`, () => {
    return HttpResponse.json({ message: 'Hello from MSW!' })
  }),
  // Catalog queries read the project's engine first (`isSparkProject`); a test project is Postgres
  // unless the test mocks the project itself.
  http.get(`${API_URL}/platform/projects/:ref`, ({ params }) => {
    return HttpResponse.json({
      cloud_provider: 'localhost',
      connectionString: '',
      db_host: 'localhost',
      id: 1,
      inserted_at: '2026-01-01T00:00:00.000Z',
      is_branch_enabled: false,
      is_physical_backups_enabled: false,
      name: 'Project',
      organization_id: 1,
      ref: String(params.ref),
      region: 'local',
      restUrl: 'http://localhost:54321',
      status: 'ACTIVE_HEALTHY',
      subscription_id: 'subscription-1',
      updated_at: '2026-01-01T00:00:00.000Z',
    })
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
