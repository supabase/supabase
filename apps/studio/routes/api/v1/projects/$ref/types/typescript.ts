import { createFileRoute } from '@tanstack/react-router'

import { constructHeaders } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { generateTypescriptTypes } from '@/lib/api/self-hosted/generate-types'
import { isStudioError } from '@/lib/errors/studio-errors'

export const Route = createFileRoute('/api/v1/projects/$ref/types/typescript')({
  server: {
    handlers: createApiHandlers(
      {
        GET: async ({ request }) => {
          const headers = constructHeaders(request.headers)

          const response = await generateTypescriptTypes({ headers })

          if (isStudioError(response)) {
            return Response.json({ message: response.message }, { status: response.code ?? 500 })
          }

          return Response.json({ types: response }, { status: 200 })
        },
      },
      { withAuth: true }
    ),
  },
})
