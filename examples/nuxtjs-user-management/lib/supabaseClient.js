import { createClient } from '@supabase/supabase-js'
import { NUXT_PUBLIC_SUPABASE_URL, NUXT_PUBLIC_SUPABASE_ANON_KEY } from './constants'

if (!NUXT_PUBLIC_SUPABASE_URL) throw new Error('Missing env.NUXT_PUBLIC_SUPABASE_URL')
if (!NUXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error('Missing env.NUXT_PUBLIC_SUPABASE_KEY')

export const supabase = createClient(NUXT_PUBLIC_SUPABASE_URL, NUXT_PUBLIC_SUPABASE_ANON_KEY)
