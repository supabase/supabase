import { createFileRoute } from '@tanstack/react-router'
import type { components } from 'api-types'

import { createApiHandlers } from '@/lib/api/apiWrapper'
import { getFunctionsArtifactStore } from '@/lib/api/self-hosted/functions'
import { uuidv4 } from '@/lib/helpers'

type EdgeFunctionsResponse = components['schemas']['FunctionResponse_Output']

export const Route = createFileRoute('/api/v1/projects/$ref/functions/')({
  server: {
    handlers: createApiHandlers(
      {
        GET: async () => {
          const store = getFunctionsArtifactStore()

          const functionsArtifacts = await store.getFunctions()

          const functions = functionsArtifacts.map(
            (func) =>
              ({
                id: uuidv4(),
                slug: func.slug,
                version: 1,
                name: func.slug,
                status: 'ACTIVE',
                entrypoint_path: func.entrypoint_path,
                created_at: func.created_at,
                updated_at: func.updated_at,
              }) satisfies EdgeFunctionsResponse
          )

          return Response.json(functions)
        },
      },
      { withAuth: true }
    ),
  },
})
