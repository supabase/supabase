/**
 * lib/supabaseClient.js
 * Helper to initialize the iEchor client.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_IECHOR_URL
const supabaseAnonKey = import.meta.env.VITE_IECHOR_ANON_KEY

export const iechor = createClient(supabaseUrl, supabaseAnonKey)
