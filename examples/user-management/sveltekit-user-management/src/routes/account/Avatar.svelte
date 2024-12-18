<!-- src/routes/account/Avatar.svelte -->
<script lang="ts">
	import type { SupabaseClient } from '@supabase/supabase-js'
	import { createEventDispatcher } from 'svelte'
	import { props, state } from 'svelte'

	const size = $props<number>(10)
	const url = $props<string>('')
	const supabase = $props<SupabaseClient>()

	const avatarUrl = $state<string | null>(null)
	const uploading = $state(false)
	let fileInput: HTMLInputElement | null = null

	const dispatch = createEventDispatcher()

	const downloadImage = async (path: string) => {
		try {
			const { data: imageData, error } = await supabase.storage.from('avatars').download(path)

			if (error) {
				throw error
			}

			const imageUrl = URL.createObjectURL(imageData)
			avatarUrl = imageUrl
		} catch (error) {
			if (error instanceof Error) {
				console.log('Error downloading image: ', error.message)
			}
		}
	}

	const uploadAvatar = async (event: Event) => {
		try {
			uploading = true
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

			url = filePath
			setTimeout(() => {
				dispatch('upload')
			}, 100)
		} catch (error) {
			if (error instanceof Error) {
				alert(error.message)
			}
		} finally {
			uploading = false
		}
	}

	$: if (url) downloadImage(url)
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
	<input type="hidden" name="avatarUrl" value={url} />

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
			on:change={uploadAvatar}
			disabled={uploading}
		/>
	</div>
</div>
