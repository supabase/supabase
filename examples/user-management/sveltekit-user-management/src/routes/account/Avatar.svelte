<!-- src/routes/account/Avatar.svelte -->
<script lang="ts">
	import type { SupabaseClient } from '@supabase/supabase-js'
	import { createEventDispatcher } from 'svelte'
	import { runes } from '@sveltejs/kit/experimental/runes'
	const { props: svelteProps, state: svelteState, effect: svelteEffect } = runes

	const size = $svelteProps<number>(10)
	const urlProp = $svelteProps<string>('')
	const supabase = $svelteProps<SupabaseClient>()

	const avatarUrl = $svelteState<string | null>(null)
	const uploading = $svelteState(false)
	const currentUrl = $svelteState(urlProp)
	let fileInput: HTMLInputElement | null = null

	const dispatch = createEventDispatcher<{
		urlChange: string;
		upload: void;
	}>()

	$svelteEffect(() => {
		// Update currentUrl when urlProp changes
		currentUrl.set(urlProp)
	})

	$svelteEffect(() => {
		// Dispatch urlChange event when currentUrl changes
		dispatch('urlChange', currentUrl)
	})

	const downloadImage = async (path: string) => {
		try {
			const { data: imageData, error } = await supabase.storage.from('avatars').download(path)

			if (error) {
				throw error
			}

			const imageUrl = URL.createObjectURL(imageData)
			avatarUrl.set(imageUrl)
		} catch (error) {
			if (error instanceof Error) {
				console.log('Error downloading image: ', error.message)
			}
		}
	}

	const uploadAvatar = async (event: Event) => {
		try {
			uploading.set(true)
			const input = event.target as HTMLInputElement
			const files = input.files

			if (!files || files.length === 0) {
				throw new Error('You must select an image to upload.')
			}

			const file = files[0]
			const fileExt = file.name.split('.').pop()
			const filePath = `${Math.random()}.${fileExt}`

			const { error } = await supabase.storage.from('avatars').upload(filePath, file)

			if (error) {
				throw error
			}

			currentUrl.set(filePath)
			setTimeout(() => {
				dispatch('upload')
			}, 100)
		} catch (error) {
			if (error instanceof Error) {
				alert(error.message)
			}
		} finally {
			uploading.set(false)
		}
	}

	$svelteEffect(() => {
		if (currentUrl) downloadImage(currentUrl)
	})
</script>

<div>
	{#if avatarUrl}
		<img
			src={avatarUrl}
			alt={avatarUrl ? 'Avatar' : 'No image'}
			class="avatar image"
			style="height: {size}em; width: {size}em;"
		/>
	{:else}
		<div class="avatar no-image" style="height: {size}em; width: {size}em;"></div>
	{/if}
	<input type="hidden" name="avatarUrl" value={currentUrl} />

	<div style="width: {size}em;">
		<label class="button primary block" for="single">
			{uploading ? 'Uploading ...' : 'Upload'}
		</label>
		<input
			style="visibility: hidden; position:absolute;"
			type="file"
			id="single"
			accept="image/*"
			bind:this={fileInput}
			onchange={uploadAvatar}
			disabled={uploading}
		/>
	</div>
</div>
