<!-- src/routes/account/Avatar.svelte -->
<script lang="ts">
	import type { SupabaseClient } from '@supabase/supabase-js'
	import { createEventDispatcher } from 'svelte'
	import { defineProps, defineState, defineEffect } from 'svelte/runes'

	const size = $defineProps<number>(10)
	const urlProp = $defineProps<string>('')
	const supabase = $defineProps<SupabaseClient>()

	const avatarUrl = $defineState<string | null>(null)
	const uploading = $defineState(false)
	const currentUrl = $defineState(urlProp)
	let fileInput: HTMLInputElement | null = null

	const dispatch = createEventDispatcher<{
		urlChange: string;
		upload: void;
	}>()

	$defineEffect(() => {
		// Update currentUrl when urlProp changes
		currentUrl.value = urlProp
	})

	$defineEffect(() => {
		// Dispatch urlChange event when currentUrl changes
		dispatch('urlChange', currentUrl.value)
	})

	const downloadImage = async (path: string) => {
		try {
			const { data: imageData, error } = await supabase.storage.from('avatars').download(path)

			if (error) {
				throw error
			}

			const imageUrl = URL.createObjectURL(imageData)
			avatarUrl.value = imageUrl
		} catch (error) {
			if (error instanceof Error) {
				console.log('Error downloading image: ', error.message)
			}
		}
	}

	const uploadAvatar = async (event: Event) => {
		try {
			uploading.value = true
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

			currentUrl.value = filePath
			setTimeout(() => {
				dispatch('upload')
			}, 100)
		} catch (error) {
			if (error instanceof Error) {
				alert(error.message)
			}
		} finally {
			uploading.value = false
		}
	}

	$defineEffect(() => {
		if (currentUrl.value) downloadImage(currentUrl.value)
	})
</script>

<div>
	{#if avatarUrl.value}
		<img
			src={avatarUrl.value}
			alt={avatarUrl.value ? 'Avatar' : 'No image'}
			class="avatar image"
			style="height: {size}em; width: {size}em;"
		/>
	{:else}
		<div class="avatar no-image" style="height: {size}em; width: {size}em;"></div>
	{/if}
	<input type="hidden" name="avatarUrl" value={currentUrl.value} />

	<div style="width: {size}em;">
		<label class="button primary block" for="single">
			{uploading.value ? 'Uploading ...' : 'Upload'}
		</label>
		<input
			style="visibility: hidden; position:absolute;"
			type="file"
			id="single"
			accept="image/*"
			bind:this={fileInput}
			onchange={uploadAvatar}
			disabled={uploading.value}
		/>
	</div>
</div>
