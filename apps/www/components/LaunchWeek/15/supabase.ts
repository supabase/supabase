import { SupabaseClient } from '@supabase/supabase-js'
import supabase from '~/lib/supabase'

/**
 * Override supabase types similar to previous use-conf-data.ts.
 * Current apps/www supabase instance uses old types.
 * Since we don't know final db layout let's leave it as any.
 */
export default supabase as SupabaseClient
