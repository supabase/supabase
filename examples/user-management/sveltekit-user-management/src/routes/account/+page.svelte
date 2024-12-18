<!-- src/routes/account/+page.svelte -->
<script lang="ts">
	import { enhance } from '$app/forms'
	import type { SubmitFunction } from '@sveltejs/kit'
	import Avatar from './Avatar.svelte'
	import { props as svelteProps, state as svelteState } from 'svelte'

	const data = $svelteProps<{ session: any; supabase: any; profile: any }>()
	const form = $svelteProps<any>()

	const { session, supabase, profile } = data
	let profileForm: HTMLFormElement | null = null
	const loading = $svelteState(false)
	const fullName = $svelteState(profile?.full_name ?? '')
	const username = $svelteState(profile?.username ?? '')
	const website = $svelteState(profile?.website ?? '')
	const avatarUrl = $svelteState(profile?.avatar_url ?? '')

	const handleSubmit = () => {
		loading.set(true)
		return async ({ update }: { update: () => void }) => {
			loading.set(false)
			update()
		}
	}

	const handleSignOut = () => {
		loading.set(true)
		return async ({ update }: { update: () => void }) => {
			loading.set(false)
			update()
		}
	}
</script>

<div class="form-widget">
	<form
		class="form-widget"
		method="post"
		action="?/update"
		use:enhance={handleSubmit}
		bind:this={profileForm}
	>
        <Avatar
            {supabase}
            bind:url={avatarUrl}
            size={10}
            on:upload={() => {
                profileForm.requestSubmit();
            }}
        />
		<div>
			<label for="email">Email</label>
			<input id="email" type="text" value={session.user.email} disabled />
		</div>

		<div>
			<label for="fullName">Full Name</label>
			<input id="fullName" name="fullName" type="text" value={form?.fullName ?? fullName} />
		</div>

		<div>
			<label for="username">Username</label>
			<input id="username" name="username" type="text" value={form?.username ?? username} />
		</div>

		<div>
			<label for="website">Website</label>
			<input id="website" name="website" type="url" value={form?.website ?? website} />
		</div>

		<div>
			<input
				type="submit"
				class="button block primary"
				value={loading ? 'Loading...' : 'Update'}
				disabled={loading}
			/>
		</div>
	</form>

	<form method="post" action="?/signout" use:enhance={handleSignOut}>
		<div>
			<button class="button block" disabled={loading}>Sign Out</button>
		</div>
	</form>
</div>
