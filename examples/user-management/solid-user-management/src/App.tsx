import { Component, createEffect, createSignal } from 'solid-js'
import { supabase } from './supabaseClient'
import Account from './Account'
import Auth from './Auth'

const App: Component = () => {
	const [userId, setUserId] = createSignal<string | null>(null)
	const [userEmail, setUserEmail] = createSignal<string | null>(null)

	const syncClaims = async () => {
		const { data } = await supabase.auth.getClaims()
		setUserId((data?.claims.sub as string) ?? null)
		setUserEmail((data?.claims.email as string) ?? null)
	}

	createEffect(() => {
		syncClaims()

		supabase.auth.onAuthStateChange(() => {
			syncClaims()
		})
	})

	return (
		<div class="container" style={{ padding: '50px 0 100px 0' }}>
			{!userId() ? <Auth /> : <Account userId={userId()!} userEmail={userEmail()} />}
		</div>
	)
}

export default App
