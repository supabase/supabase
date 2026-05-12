import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VUE_APP_SUPABASE_URL
const supabasePublishableKey = process.env.VUE_APP_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl) {
  throw new Error(
    'Environment variable VUE_APP_SUPABASE_URL is not set. Please define it before starting the application.'
  )
}

if (!supabasePublishableKey) {
  throw new Error(
    'Environment variable VUE_APP_SUPABASE_PUBLISHABLE_KEY is not set. Please define it before starting the application.'
  )
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
