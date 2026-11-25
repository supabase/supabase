import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'
import { POSTGRES_PORT } from '@/lib/api/self-hosted/constants'
import {
  DEFAULT_PROJECT,
  PROJECT_DB_HOST,
  PROJECT_ENDPOINT,
  PROJECT_ENDPOINT_PROTOCOL,
  PROJECT_REST_URL,
} from '@/lib/constants/api'

export const Route = createFileRoute('/api/platform/props/project/$ref/api')({
  server: {
    handlers: createApiHandlers({
      GET: () => {
        // Platform specific endpoint
        const response = {
          project: {
            ...DEFAULT_PROJECT,
            api_key_supabase_encrypted: '',
            db_host: PROJECT_DB_HOST,
            db_name: 'postgres',
            db_port: POSTGRES_PORT,
            db_ssl: false,
            db_user: 'postgres',
            services: [
              {
                id: 1,
                name: 'Default API',
                app: { id: 1, name: 'Auto API' },
                app_config: {
                  db_schema: 'public',
                  endpoint: PROJECT_ENDPOINT,
                  realtime_enabled: true,
                },
                service_api_keys: [
                  {
                    api_key_encrypted: '-',
                    name: 'service_role key',
                    tags: 'service_role',
                  },
                  {
                    api_key_encrypted: '-',
                    name: 'anon key',
                    tags: 'anon',
                  },
                ],
              },
            ],
          },
          autoApiService: {
            id: 1,
            name: 'Default API',
            project: { ref: 'default' },
            app: { id: 1, name: 'Auto API' },
            app_config: {
              db_schema: 'public',
              endpoint: PROJECT_ENDPOINT,
              realtime_enabled: true,
            },
            protocol: PROJECT_ENDPOINT_PROTOCOL,
            endpoint: PROJECT_ENDPOINT,
            restUrl: PROJECT_REST_URL,
            defaultApiKey: process.env.SUPABASE_ANON_KEY,
            serviceApiKey: process.env.SUPABASE_SERVICE_KEY,
            service_api_keys: [
              {
                api_key_encrypted: '-',
                name: 'service_role key',
                tags: 'service_role',
              },
              {
                api_key_encrypted: '-',
                name: 'anon key',
                tags: 'anon',
              },
            ],
          },
        }

        return Response.json(response, { status: 200 })
      },
    }),
  },
})
