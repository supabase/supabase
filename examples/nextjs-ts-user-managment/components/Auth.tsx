import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Auth({}) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')

  const handleLogin = async (email: string) => {
    try {
      setLoading(true)
      const { error, user } = await supabase.auth.signIn({ email })

      if (error) {
        throw error
      }

      alert('Check your email for the login link!')
    } catch (error) {
      alert(error.error_description || error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 20, flexDirection: 'column' }}>
      <div>
        <label>Email</label>
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <button
          onClick={(e) => {
            e.preventDefault()
            handleLogin(email)
          }}
          className={'button block primary'}
          disabled={loading}
        >
          {loading ? 'Loading ..' : 'Sign up with magic link'}
        </button>
      </div>
    </div>
  )
}
