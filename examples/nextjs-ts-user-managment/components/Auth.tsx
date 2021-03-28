import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
// import styles from '../styles/Auth.module.css'

export default function Auth({}) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')

  const handleLogin = async (email: string) => {
    try {
      setLoading(true)
      const { error, user } = await supabase.auth.signIn({ email })
      if (error) throw error
      console.log('user', user)
      alert('Check your email for the login link!')
    } catch (error) {
      console.log('Error thrown:', error.message)
      alert(error.error_description || error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="authContainer">
      <div className="authTitle">
        <h1 className="header">Experience our Auth and Storage system</h1>
        <p className="description">
          Through a simple profile management example. Create a user profile and upload an avatar
          image. Fast, simple, secure.
        </p>
      </div>
      <div className="authWidget" style={{ display: 'flex', gap: 20, flexDirection: 'column' }}>
        <p className="description">Sign in via magic link with your email below</p>
        <input
          className="inputField"
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          onClick={(e) => {
            e.preventDefault()
            handleLogin(email)
          }}
          className={'button block'}
          disabled={loading}
        >
          {loading ? <img className="loader" src="loader.svg" /> : <span>Send magic link</span>}
        </button>
      </div>
    </div>
  )
}
