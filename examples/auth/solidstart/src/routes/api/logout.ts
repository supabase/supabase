import { action, redirect } from 'solid-start/server'

export const POST = action(async (_, { request }) => {
  const { supabase } = request.locals

  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error('Failed to sign out')
  }

  throw redirect('/')
})
