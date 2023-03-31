import { Component, createEffect, createSignal, JSX } from 'solid-js'
import { supabase } from './supabaseClient'

interface Props {
	size: number
	url: string | null
	onUpload: (event: Event, filePath: string) => void
}

const Avatar: Component<Props> = (props) => {
	const [avatarUrl, setAvatarUrl] = createSignal<string | null>(null)
	const [uploading, setUploading] = createSignal(false)

	createEffect(() => {
		if (props.url) downloadImage(props.url)
	})

	const downloadImage = async (path: string) => {
		try {
			const { data, error } = await supabase.storage.from('avatars').download(path)
			if (error) {
				throw error
			}
			const url = URL.createObjectURL(data)
			setAvatarUrl(url)
		} catch (error) {
			if (error instanceof Error) {
				console.log('Error downloading image: ', error.message)
			}
		}
	}

	const uploadAvatar: JSX.EventHandler<HTMLInputElement, Event> = async (event) => {
		try {
			setUploading(true)

			const target = event.currentTarget
			if (!target?.files || target.files.length === 0) {
				throw new Error('You must select an image to upload.')
			}

			const file = target.files[0]
			const fileExt = file.name.split('.').pop()
			const fileName = `${Math.random()}.${fileExt}`
			const filePath = `${fileName}`

			let { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)

			if (uploadError) {
				throw uploadError
			}

			props.onUpload(event, filePath)
		} catch (error) {
			if (error instanceof Error) {
				alert(error.message)
			}
		} finally {
			setUploading(false)
		}
	}

	return (
		<div style={{ width: props.size }} aria-live="polite">
			{avatarUrl() ? (
				<img
					src={avatarUrl()!}
					alt={avatarUrl() ? 'Avatar' : 'No image'}
					class="avatar image"
					style={{ height: `${props.size}px`, width: `${props.size}px` }}
				/>
			) : (
				<div
					class="avatar no-image"
					style={{ height: `${props.size}px`, width: `${props.size}px` }}
				/>
			)}
			<div style={{ width: `${props.size}px` }}>
				<label class="button primary block" for="single">
					{uploading() ? 'Uploading ...' : 'Upload avatar'}
				</label>
				<span style="display:none">
					<input
						type="file"
						id="single"
						accept="image/*"
						onChange={uploadAvatar}
						disabled={uploading()}
					/>
				</span>
			</div>
		</div>
	)
}

export default Avatar
