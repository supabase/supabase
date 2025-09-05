import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          realtime: {
            params: {
              eventsPerSecond: 1000,
            },
          },
        }
      )
    : undefined

export type SupabaseClient = typeof supabase

export default supabase
