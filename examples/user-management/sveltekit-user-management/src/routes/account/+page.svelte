<!-- src/routes/account/+page.svelte -->
<script lang="ts">
	import { enhance } from '$app/forms'
	import type { SubmitFunction } from '@sveltejs/kit'
	import Avatar from './Avatar.svelte'
	import { props, state } from 'svelte'

	const data = $props<{ session: any; supabase: any; profile: any }>()
	const form = $props<any>()

	const { session, supabase, profile } = data
	let profileForm: HTMLFormElement | null = null
	const loading = $state(false)
	const fullName = $state(profile?.full_name ?? '')
	const username = $state(profile?.username ?? '')
	const website = $state(profile?.website ?? '')
	const avatarUrl = $state(profile?.avatar_url ?? '')

	const handleSubmit = () => {
		loading.value = true
		return async ({ update }: { update: () => void }) => {
			loading.value = false
			update()
		}
	}

	const handleSignOut = () => {
		loading.value = true
		return async ({ update }: { update: () => void }) => {
			loading.value = false
			update()
		}
	}

	const handleUrlChange = (event: CustomEvent<string>) => {
		avatarUrl.value = event.detail
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
			urlProp={avatarUrl.value}
			size={10}
			on:urlChange={handleUrlChange}
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
			<input id="fullName" name="fullName" type="text" value={form?.fullName ?? fullName.value} />
		</div>

		<div>
			<label for="username">Username</label>
			<input id="username" name="username" type="text" value={form?.username ?? username.value} />
		</div>

		<div>
			<label for="website">Website</label>
			<input id="website" name="website" type="url" value={form?.website ?? website.value} />
		</div>

		<div>
			<input
				type="submit"
				class="button block primary"
				value={loading.value ? 'Loading...' : 'Update'}
				disabled={loading.value}
			/>
		</div>
	</form>

	<form method="post" action="?/signout" use:enhance={handleSignOut}>
		<div>
			<button class="button block" disabled={loading.value}>Sign Out</button>
		</div>
	</form>
</div>
