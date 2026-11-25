import { createFileRoute } from '@tanstack/react-router'
import type { components } from 'api-types'

import { createApiHandlers } from '@/lib/api/apiWrapper'
import { getFunctionsArtifactStore } from '@/lib/api/self-hosted/functions'
import { uuidv4 } from '@/lib/helpers'

type EdgeFunctionsResponse = components['schemas']['FunctionResponse_Output']

export const Route = createFileRoute('/api/v1/projects/$ref/functions/$slug/')({
  server: {
    handlers: createApiHandlers(
      {
        GET: async ({ params }) => {
          const { slug } = params
          if (!slug) {
            return Response.json(
              { error: { message: `Missing function 'slug' parameter` } },
              { status: 404 }
            )
          }

          const store = getFunctionsArtifactStore()

          const functionsArtifact = await store.getFunctionBySlug(slug)
          if (!functionsArtifact) {
            return Response.json({ error: { message: `Function not found` } }, { status: 404 })
          }

          const functionResponse = {
            id: uuidv4(),
            slug: functionsArtifact.slug,
            version: 1,
            name: functionsArtifact.slug,
            status: 'ACTIVE',
            entrypoint_path: functionsArtifact.entrypoint_path,
            created_at: functionsArtifact.created_at,
            updated_at: functionsArtifact.updated_at,
          } satisfies EdgeFunctionsResponse

          return Response.json(functionResponse, { status: 200 })
        },
      },
      { withAuth: true }
    ),
  },
})
