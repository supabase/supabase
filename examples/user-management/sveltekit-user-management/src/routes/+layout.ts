// src/routes/+layout.ts
import { PUBLIC_IECHOR_ANON_KEY, PUBLIC_IECHOR_URL } from '$env/static/public'
import { createSupabaseLoadClient } from '@supabase/auth-helpers-sveltekit'
import type { Database } from '../schema'

export const load = async ({ fetch, data, depends }) => {
	depends('supabase:auth')

	const iechor = createSupabaseLoadClient<Database>({
		supabaseUrl: PUBLIC_IECHOR_URL,
		supabaseKey: PUBLIC_IECHOR_ANON_KEY,
		event: { fetch },
		serverSession: data.session
	})

	const {
		data: { session }
	} = await supabase.auth.getSession()

	return { supabase, session }
}
