import type { SupabaseContext } from '@supabase/server'

import type { Database } from '../db/database.types'
import { HttpError } from './errors'

export type HandlerContext = SupabaseContext<Database> & {
  platformUserId?: string
  platformToken?: string
}

export function requireUserId(ctx: HandlerContext): string {
  const id = ctx.userClaims?.id
  if (!id) {
    throw new HttpError(401, 'unauthorized', 'Sign in to continue.')
  }
  return id
}
