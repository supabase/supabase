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

const STARTER_MONITORS = [
  { name: 'Supabase', url: 'https://supabase.com' },
  { name: 'GitHub', url: 'https://github.com' },
  // A page that 404s, to show an incident opening.
  { name: 'Broken page', url: 'https://supabase.com/this-page-does-not-exist' },
]

let seeding: Promise<void> | null = null

/** Gives a new visitor a few monitors to watch. Runs once per page load. */
export function seedMonitors(): Promise<void> {
  seeding ??= (async () => {
    const { count, error } = await supabase
      .from('monitors')
      .select('id', { count: 'exact', head: true })
    if (error) throw error
    if (count && count > 0) return
    const { error: insertError } = await supabase.from('monitors').insert(STARTER_MONITORS)
    if (insertError) throw insertError
  })()
  return seeding
}
