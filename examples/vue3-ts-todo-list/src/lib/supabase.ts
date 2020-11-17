import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.VUE_APP_SUPABASE_URL as string,
  process.env.VUE_APP_SUPABASE_KEY as string
)
