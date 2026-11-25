import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'
import { selfHostedSupabaseAdmin as supabase } from '@/lib/api/self-hosted-admin'

export const Route = createFileRoute('/api/platform/auth/$ref/users/$id/factors')({
  server: {
    handlers: createApiHandlers({
      DELETE: async ({ params }) => {
        const id = params.id as string

        // Get all factors for the user
        const { data: factors, error } = await supabase.auth.admin.mfa.listFactors({
          userId: id,
        })
        if (error) {
          return Response.json({ error: { message: error.message } }, { status: 400 })
        }

        const results = await Promise.all(
          (factors?.factors ?? []).map((factor) =>
            supabase.auth.admin.mfa.deleteFactor({
              id: factor.id,
              userId: id,
            })
          )
        )
        const failed = results.find((result) => result.error)
        if (failed?.error) {
          return Response.json({ error: { message: failed.error.message } }, { status: 400 })
        }

        return Response.json({ data: null, error: null }, { status: 200 })
      },
    }),
  },
})
