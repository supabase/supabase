import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'
import { POSTGRES_PORT } from '@/lib/api/self-hosted/constants'
import { PROJECT_DB_HOST, PROJECT_REST_URL } from '@/lib/constants/api'

export const Route = createFileRoute('/api/platform/projects/$ref/databases')({
  server: {
    handlers: createApiHandlers({
      GET: () =>
        Response.json(
          [
            {
              cloud_provider: 'localhost',
              connectionString: '',
              connection_string_read_only: '',
              db_host: PROJECT_DB_HOST,
              db_name: 'postgres',
              db_port: POSTGRES_PORT,
              db_user: 'postgres',
              identifier: 'default',
              inserted_at: '',
              region: 'local',
              restUrl: PROJECT_REST_URL,
              size: '',
              status: 'ACTIVE_HEALTHY',
            },
          ],
          { status: 200 }
        ),
    }),
  },
})
