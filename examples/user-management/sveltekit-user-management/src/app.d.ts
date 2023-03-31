// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
	interface Supabase {
		Database: import('./schema').Database;
		SchemaName: 'public';
	}

	interface PageData {
		session: import('@supabase/supabase-js').Session | null
	}
}
