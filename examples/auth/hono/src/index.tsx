import { Hono } from 'hono'
import { getSupabase, supabaseMiddleware } from './middleware/auth.middleware'

const app = new Hono()
app.use('*', supabaseMiddleware())

app.get('/api/user', async (c) => {
  const supabase = getSupabase(c)
  const { data, error } = await supabase.auth.getClaims()

  if (error) console.log('error', error)

  if (!data?.user) {
    return c.json({
      message: 'You are not logged in.',
    })
  }

  return c.json({
    message: 'You are logged in!',
    userId: data.user,
  })
})

app.get('/signout', async (c) => {
  const supabase = getSupabase(c)
  await supabase.auth.signOut()
  console.log('Signed out server-side!')
  return c.redirect('/')
})

// Retrieve data with RLS enabled. The signed in user's auth token is automatically sent.
app.get('/countries', async (c) => {
  const supabase = getSupabase(c)
  const { data, error } = await supabase.from('countries').select('*')
  if (error) console.log(error)
  return c.json(data)
})

export default app