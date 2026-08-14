import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from './database.types'

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      supabase: SupabaseClient<Database>
    }
    // interface PageState {}
    // interface Platform {}
  }
}

export {}
