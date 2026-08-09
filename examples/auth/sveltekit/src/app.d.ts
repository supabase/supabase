import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

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
