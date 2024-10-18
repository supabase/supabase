import { createClient } from '@supabase/supabase-js'
import { revalidateTag } from 'next/cache'
import { headers } from 'next/headers'
import { type NextRequest } from 'next/server'
import { z } from 'zod'

import { type Database } from 'common'

enum AuthorizationLevel {
  Unauthorized,
  Basic,
  Override,
}

const requestBodySchema = z.object({
  tags: z.array(z.string()),
})

export const POST = handleError(_handleRevalidateRequest)

export async function _handleRevalidateRequest(request: NextRequest) {
  const requestHeaders = headers()
  const authorization = requestHeaders.get('Authorization')
  if (!authorization) {
    return new Response('Missing Authorization header', { status: 401 })
  }

  const basicKeys = process.env.DOCS_REVALIDATION_KEYS?.split(/\s*,\s*/) ?? []
  const overrideKeys = process.env.DOCS_REVALIDATION_OVERRIDE_KEYS?.split(/\s*,\s*/) ?? []
  if (basicKeys.length === 0 && overrideKeys.length === 0) {
    console.error('No keys configured for revalidation')
    return new Response('Internal server error', {
      status: 500,
    })
  }

  let authorizationLevel = AuthorizationLevel.Unauthorized

  const token = authorization.replace(/^Bearer\s+/, '')
  if (overrideKeys.includes(token)) {
    authorizationLevel = AuthorizationLevel.Override
  } else if (basicKeys.includes(token)) {
    authorizationLevel = AuthorizationLevel.Basic
  }

  if (authorizationLevel === AuthorizationLevel.Unauthorized) {
    return new Response('Invalid Authorization header', { status: 401 })
  }

  let result: z.infer<typeof requestBodySchema>
  try {
    result = requestBodySchema.parse(await request.json())
  } catch (error) {
    console.error(error)
    return new Response(
      'Malformed request body: should be a JSON object with a "tags" array of strings.',
      { status: 400 }
    )
  }

  const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )

  if (authorizationLevel === AuthorizationLevel.Basic) {
    const { data: lastRevalidation, error } = await supabaseAdmin.rpc(
      'get_last_revalidation_for_tags',
      {
        tags: result.tags,
      }
    )
    if (error) {
      console.error(error)
      return new Response('Internal server error', { status: 500 })
    }

    const sixHoursAgo = new Date()
    sixHoursAgo.setHours(sixHoursAgo.getHours() - 6)
    if (lastRevalidation?.some((revalidation) => new Date(revalidation.created_at) > sixHoursAgo)) {
      return new Response(
        'Your request includes a tag that has been revalidated within the last 6 hours. You can override this limit by authenticating with Override permissions.',
        {
          status: 429,
        }
      )
    }
  }

  const { error } = await supabaseAdmin
    .from('validation_history')
    .insert(result.tags.map((tag) => ({ tag })))
  if (error) {
    console.error('Failed to update revalidation table: %o', error)
  }

  result.tags.forEach((tag) => {
    revalidateTag(tag)
  })

  return new Response(null, {
    status: 204,
    headers: {
      'Cache-Control': 'no-cache',
    },
  })
}

function handleError(handleRequest: (request: NextRequest) => Promise<Response>) {
  return async function (request: NextRequest) {
    try {
      const response = await handleRequest(request)
      return response
    } catch (error) {
      console.error(error)
      return new Response('Internal server error', { status: 500 })
    }
  }
}
