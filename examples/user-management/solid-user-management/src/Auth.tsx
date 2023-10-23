import { Component, createSignal } from 'solid-js'
import { supabase } from './supabaseClient'

const Auth: Component = () => {
	const [loading, setLoading] = createSignal(false)
	const [email, setEmail] = createSignal('')

	const handleLogin = async (e: SubmitEvent) => {
		e.preventDefault()

		try {
			setLoading(true)
			const { error } = await supabase.auth.signInWithOtp({ email: email() })
			if (error) throw error
			alert('Check your email for login link!')
		} catch (error) {
			if (error instanceof Error) {
				alert(error.message)
			}
		} finally {
			setLoading(false)
		}
	}

	return (
		<div class="row flex-center flex">
			<div class="col-6 form-widget" aria-live="polite">
				<h1 class="header">Supabase + SolidJS</h1>
				<p class="description">Sign in via magic link with your email below</p>
				<form class="form-widget" onSubmit={handleLogin}>
					<div>
						<label for="email">Email</label>
						<input
							id="email"
							class="inputField"
							type="email"
							placeholder="Your email"
							value={email()}
							onChange={(e) => setEmail(e.currentTarget.value)}
						/>
					</div>
					<div>
						<button type="submit" class="button block" aria-live="polite">
							{loading() ? <span>Loading</span> : <span>Send magic link</span>}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}

export default Auth
