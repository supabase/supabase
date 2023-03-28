import { createClient } from '@supabase/supabase-js'
// import { RealtimeClient } from '@supabase/realtime-js'

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    realtime: {
      params: {
        eventsPerSecond: -1,
      },
    },
  }
)

// const supabaseClient = new RealtimeClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, {
//   params: {
//     apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     eventsPerSecond: -1,
//   },
// })

export default supabaseClient
