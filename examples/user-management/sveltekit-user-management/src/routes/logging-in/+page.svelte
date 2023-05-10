<!-- src/routes/logging-in/+page.svelte -->
<script lang="ts">
	import { browser } from '$app/environment'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'

	export let data
	$: {
		const redirectTo = $page.url.searchParams.get('redirect')

		// check if user has been set in session store then redirect
		if (browser && data.session) {
			goto(redirectTo ?? '/account')
		}
	}
</script>

<section>
	"Because as we know, there are known knowns; there are things we know we know. We also know there
	are known unknowns; that is to say we know there are some things we do not know. But there are
	also unknown unknowns—the ones we don't know we don't know" - Donald Rumsfeld
</section>
