import { z } from 'zod'

import { supabase } from './supabase'

const statusSchema = z.object({
  total: z.number(),
  me: z
    .object({
      name: z.string(),
      referral_code: z.string(),
      referrals: z.number(),
      position: z.number(),
    })
    .nullable(),
  leaderboard: z.array(
    z.object({ initials: z.string().nullable(), referrals: z.number(), is_me: z.boolean() })
  ),
})

export type WaitlistStatus = z.infer<typeof statusSchema>

/** The total, your own place in line, and the top referrers (initials only). */
export async function fetchStatus(): Promise<WaitlistStatus> {
  const { data, error } = await supabase.rpc('waitlist_status')
  if (error) throw error
  return statusSchema.parse(data)
}

export async function joinWaitlist(input: { name: string; email: string; ref: string | null }) {
  const { error } = await supabase.from('waitlist_entries').insert({
    name: input.name.trim(),
    email: input.email.trim(),
    referral_code_used: input.ref,
  })
  if (error?.code === '23505') throw new Error('That email is already on the list.')
  if (error?.code === '23514') throw new Error('Check your name and email and try again.')
  if (error) throw error
}

export async function leaveWaitlist() {
  const { error } = await supabase.from('waitlist_entries').delete().not('id', 'is', null)
  if (error) throw error
}

/**
 * Calls `onChange` whenever anyone joins or leaves. The database broadcasts on
 * the public `waitlist` topic (see `broadcast_waitlist_total` in the migration).
 */
export function subscribeToChanges(onChange: () => void) {
  const channel = supabase
    .channel('waitlist')
    .on('broadcast', { event: 'changed' }, onChange)
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
