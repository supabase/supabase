import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import z from 'zod'

import { DASHBOARD_LOG_BUCKET } from '@/components/interfaces/Support/dashboard-logs'
import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { getUserClaims } from '@/lib/gotrue'

const GenerateAttachmentUrlSchema = z.object({
  filenames: z.array(z.string()),
  bucket: z
    .enum(['support-attachments', 'feedback-attachments', DASHBOARD_LOG_BUCKET])
    .default('support-attachments'),
})

async function handlePost(request: Request): Promise<Response> {
  const { claims, error: userClaimsError } = await getUserClaims(
    request.headers.get('authorization') ?? ''
  )
  if (userClaimsError || !claims) {
    return Response.json({ error: { message: 'Unauthorized' } }, { status: 401 })
  }
  const userId = claims.sub

  const json = await parseJsonBody(request)
  const parseResult = GenerateAttachmentUrlSchema.safeParse(json)
  if (!parseResult.success) {
    return Response.json({ error: { message: 'Invalid request body' } }, { status: 400 })
  }
  const filenames = parseResult.data.filenames

  const requestedPrefixes = [...new Set(filenames.map((filename) => filename.split('/')[0]))]
  if (requestedPrefixes.some((prefix) => prefix !== userId)) {
    return Response.json(
      { error: { message: 'Forbidden: Users can only access their own resources' } },
      { status: 403 }
    )
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPPORT_API_URL!,
    process.env.SUPPORT_SUPABASE_SECRET_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        // @ts-expect-error
        multiTab: false,
        detectSessionInUrl: false,
        localStorage: {
          getItem: (_key: string) => undefined,
          setItem: (_key: string, _value: string) => {},
          removeItem: (_key: string) => {},
        },
      },
    }
  )

  const bucket = parseResult.data.bucket
  // Create signed URLs for 10 years
  const { data, error: signedUrlError } = await adminSupabase.storage
    .from(bucket)
    .createSignedUrls(filenames, 10 * 365 * 24 * 60 * 60)
  if (signedUrlError) {
    console.error('Failed to sign URLs for attachments', signedUrlError)
    return Response.json(
      { error: { message: 'Failed to sign URLs for attachments' } },
      { status: 500 }
    )
  }
  return Response.json(data ? data.map((file) => file.signedUrl) : [], { status: 200 })
}

export const Route = createFileRoute('/api/generate-attachment-url')({
  server: {
    handlers: createApiHandlers(
      {
        POST: ({ request }) => handlePost(request),
      },
      { withAuth: true }
    ),
  },
})
