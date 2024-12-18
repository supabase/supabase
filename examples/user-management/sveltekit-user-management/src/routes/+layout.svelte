<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../styles.css'
	import { invalidate } from '$app/navigation'
	import { defineProps, defineEffect } from 'svelte/runes'

	const data = $defineProps<{ supabase: any; session: any }>()
	const { supabase, session } = data

	$defineEffect(() => {
		const { data: authData } = supabase.auth.onAuthStateChange((event, _session) => {
			if (_session?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth')
			}
		})

		return () => {
			authData.subscription.unsubscribe()
		}
	})
</script>

<svelte:head>
	<title>User Management</title>
</svelte:head>

<div class="container" style="padding: 50px 0 100px 0">
	{@render slot()}
</div>
