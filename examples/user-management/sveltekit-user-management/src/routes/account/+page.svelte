<!-- src/routes/account/+page.svelte -->
<script lang="ts">
	import { enhance } from '$app/forms'
	import type { SubmitFunction } from '@sveltejs/kit'
	import Avatar from './Avatar.svelte'
	import { props as defineProps, state as defineState } from '$app/experimental/runes'

	const data = $defineProps<{ session: any; supabase: any; profile: any }>()
	const form = $defineProps<any>()

	const { session, supabase, profile } = data
	let profileForm: HTMLFormElement | null = null
	const loading = $defineState(false)
	const fullName = $defineState(profile?.full_name ?? '')
	const username = $defineState(profile?.username ?? '')
	const website = $defineState(profile?.website ?? '')
	const avatarUrl = $defineState(profile?.avatar_url ?? '')

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

	const handleUrlChange = (event: CustomEvent<string>) => {
		avatarUrl.set(event.detail)
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
			urlProp={avatarUrl}
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
