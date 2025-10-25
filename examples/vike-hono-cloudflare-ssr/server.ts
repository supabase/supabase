import { Hono } from 'hono'
import { apply } from '@vike/hono'
import { supabaseMiddleware, getSupabase, getSupabaseHeaders, mergeSupabaseCookies } from './middleware/supabase'

const app = new Hono()

// Apply Supabase middleware first (for all routes)
app.use('*', supabaseMiddleware())

// API routes (these work normally with Hono middleware)
app.get('/api/user', async (c) => {
  const supabase = getSupabase(c)
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    return c.json({ error: error.message }, 401)
  }

  if (!data?.user) {
    return c.json({ message: 'You are not logged in.' }, 401)
  }

  return c.json({
    message: 'You are logged in!',
    user: data.user,
  })
})

app.post('/api/auth/signout', async (c) => {
  const supabase = getSupabase(c)
  await supabase.auth.signOut()
  return c.json({ message: 'Signed out successfully' })
})

// Apply Vike middleware - this will intercept SSR requests
await apply(app, {
  // Custom response handler to merge Supabase cookies
  responseHandler: (vikeResponse: Response, context: any) => {
    // Get Supabase headers from Hono context
    const supabaseHeaders = getSupabaseHeaders(context.c)
    
    // Merge Supabase cookies with Vike response
    return mergeSupabaseCookies(vikeResponse, supabaseHeaders)
  }
})

export default app
