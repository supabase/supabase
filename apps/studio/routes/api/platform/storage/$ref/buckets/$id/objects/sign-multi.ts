import { createFileRoute } from '@tanstack/react-router'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { selfHostedSupabaseAdmin as supabase } from '@/lib/api/self-hosted-admin'

export const Route = createFileRoute('/api/platform/storage/$ref/buckets/$id/objects/sign-multi')({
  server: {
    handlers: createApiHandlers({
      POST: async ({ request, params }) => {
        const { path, expiresIn = 60 * 60 * 24 } = await parseJsonBody<{
          path: string[]
          expiresIn?: number
        }>(request)

        const { data, error } = await supabase.storage
          .from(params.id as string)
          .createSignedUrls(path, expiresIn)

        if (error) {
          return Response.json({ error: { message: error.message } }, { status: 400 })
        }

        const parsed = new URL(process.env.SUPABASE_PUBLIC_URL!)
        const remapped = (data ?? []).map((item) => {
          if (!item.signedUrl) return item
          const signedUrl = new URL(item.signedUrl)
          signedUrl.protocol = parsed.protocol
          signedUrl.host = parsed.host
          signedUrl.port = parsed.port
          return { ...item, signedUrl: signedUrl.href }
        })

        return Response.json(remapped, { status: 201 })
      },
    }),
  },
})
