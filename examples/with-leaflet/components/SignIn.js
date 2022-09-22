import React, { useState } from 'react'
import { supabase } from 'lib/api'

/**
 * Sign in with username and password
 *
 * @param {String} role   DRIVER/MANAGER. default as DRIVER
 */
export default function SignIn({ role = 'DRIVER' }) {
  const [formData, updateFormData] = useState({ role })
  const [action, setAction] = useState(null)

  function onChange(e) {
    updateFormData({
      ...formData,

      // Trimming any whitespace
      [e.target.name]: e.target.value.trim(),
    })
  }

  async function updateUserRole(user) {
    if (!user || user.user_metadata?.role) return

    // update user role
    await supabase.auth.update({
      data: { role },
    })
  }

  async function onSubmit(event) {
    event.preventDefault()

    try {
      if (action === 'SIGNUP') {
        const { email, password, role } = formData
        const { error, user } = await supabase.auth.signUp({ email, password })
        if (error) throw error

        // update user role
        await supabase.auth.update({
          data: { role },
        })
      } else if (action === 'LOGIN') {
        const { error } = await supabase.auth.signIn(formData)
        if (error) throw error
      }
    } catch (error) {
      alert(error.message)
    }
  }

  return (
    <form className="form-container" onSubmit={onSubmit}>
      <label>
        Email
        <input name="email" type="email" onChange={onChange} />
      </label>
      <label>
        Password
        <input name="password" type="password" onChange={onChange} />
      </label>
      <button type="submit" onClick={() => setAction('SIGNUP')}>
        Sign up
      </button>
      <button type="submit" onClick={() => setAction('LOGIN')}>
        Login
      </button>
      <style jsx>{`
        .form-container {
          min-width: 20rem;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
        }

        label {
          display: flex;
          flex-direction: column;
          margin-bottom: 1rem;
        }

        input {
          margin-top: 0.5rem;
          padding: 0.5rem;
          font-size: 1rem;
        }

        button {
          margin-top: 0.5rem;
          padding: 0.5rem;
          font-size: 1rem;
        }
      `}</style>
    </form>
  )
}
