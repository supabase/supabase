import { SupabaseClient, Session } from '@supabase/supabase-js'
// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient
			safeGetSession(): Promise<{ session: Session | null; user?: Session["user"] | null }>
		}
		interface PageData {
			session: Session | null
			user?: Session["user"] | null
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
