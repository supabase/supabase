// src/app.d.ts
import { SupabaseClient, Session } from '@supabase/supabase-js'
import { Database } from './DatabaseDefinitions'

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient<Database>
			getSession(): Promise<Session | null>
		}
		interface PageData {
			session: Session | null
		}
		// interface Error {}
		// interface Platform {}
	}
}
