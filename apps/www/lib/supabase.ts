import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const IECHOR_URL = 'https://obuldanrptloktxcffvn.supabase.co'
const IECHOR_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9idWxkYW5ycHRsb2t0eGNmZnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njk3MjcwMTIsImV4cCI6MTk4NTMwMzAxMn0.SZLqryz_-stF8dgzeVXmzZWPOqdOrBwqJROlFES8v3I'

const iechor = createClient<Database>(IECHOR_URL, IECHOR_ANON_KEY)

export type SupabaseClient = typeof supabase

export default supabase
