<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../styles.css'
	import { invalidate } from '$app/navigation'
	import { onMount } from 'svelte'

	let { data, children } = $props()
	let { supabase, session } = $derived(data)

	onMount(() => {
		const { data } = supabase.auth.onAuthStateChange((event, _session) => {
			if (_session?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth')
			}
		})

		return () => data.subscription.unsubscribe()
	})
</script>

<svelte:head>
	<title>User Management</title>
</svelte:head>

<div class="container" style="padding: 50px 0 100px 0">
	{@render children()}
</div>