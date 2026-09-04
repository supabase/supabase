import type { SupabaseContext } from '@supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

import { HttpError } from './errors'

export type HandlerContext = Omit<SupabaseContext, 'supabase' | 'supabaseAdmin'> & {
  supabase: SupabaseClient
  supabaseAdmin: SupabaseClient
}

export function requireUserId(ctx: HandlerContext): string {
  const id = ctx.userClaims?.id
  if (!id) {
    throw new HttpError(401, 'unauthorized', 'Sign in to continue.')
  }
  return id
}
