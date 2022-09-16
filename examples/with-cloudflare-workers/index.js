import { createClient } from '@supabase/supabase-js'

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const db = createClient(
    'YOUR_SUPABASE_URL', // Replace with your project's URL
    'YOUR_SUPABASE_KEY', // Replace with your project's anon/service_role key
    {
      fetch: fetch.bind(globalThis), // Tell Supabase Client to use Cloudflare Workers' global `fetch` API to make requests
    }
  )
  const { data, error } = await db.from('YOUR_TABLE_NAME').select('*')

  if (error) {
    console.log(error)
    return new Response(error.message || error.toString(), {
      status: 500,
    })
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
