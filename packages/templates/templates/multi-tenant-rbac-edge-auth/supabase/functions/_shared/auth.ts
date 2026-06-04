import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

import { unauthorized } from './responses.ts'

export function getBearerToken(req: Request): string | null {
  const authorization = req.headers.get('Authorization')

  if (!authorization?.startsWith('Bearer ')) {
    return null
  }

  return authorization.slice('Bearer '.length).trim()
}

export function createUserClient(req: Request): SupabaseClient | null {
  const accessToken = getBearerToken(req)

  if (!accessToken) {
    return null
  }

  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}

export async function requireUser(req: Request) {
  const client = createUserClient(req)

  if (!client) {
    return { response: unauthorized() } as const
  }

  const {
    data: { user },
    error,
  } = await client.auth.getUser()

  if (error || !user) {
    return { response: unauthorized() } as const
  }

  return { client, user } as const
}
