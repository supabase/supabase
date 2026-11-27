import type { User } from '@supabase/supabase-js'

import { supabase } from './supabase'

let sessionUser: Promise<User> | null = null

/**
 * Signs in anonymously when there is no session, so the app works without a
 * login. Shared, so concurrent callers (such as React StrictMode running an
 * effect twice) never create two anonymous users.
 */
export function ensureSession(): Promise<User> {
  sessionUser ??= (async () => {
    const { data } = await supabase.auth.getSession()
    if (data.session) return data.session.user
    const { data: signIn, error } = await supabase.auth.signInAnonymously()
    if (error) throw error
    return signIn.user!
  })().catch((error) => {
    sessionUser = null
    throw error
  })
  return sessionUser
}
