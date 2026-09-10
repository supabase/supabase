import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VUE_APP_SUPABASE_URL
const supabaseKey = process.env.VUE_APP_SUPABASE_KEY

if (!supabaseUrl) {
  throw new Error(
    'Environment variable VUE_APP_SUPABASE_URL is not set. Please define it before starting the application.'
  )
}

if (!supabaseKey) {
  throw new Error(
    'Environment variable VUE_APP_SUPABASE_KEY is not set. Please define it before starting the application.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)
