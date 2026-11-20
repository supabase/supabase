import type { JwtPayload, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      supabase: SupabaseClient<Database>
      claims: JwtPayload | null
    }
    interface PageData {
      claims: JwtPayload | null
    }
    // interface PageState {}
    // interface Platform {}
  }
}

export {}
