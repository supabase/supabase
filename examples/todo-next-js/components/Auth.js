import { useState } from 'react'
import { supabase } from '../lib/api'

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (type, email, password) => {
    const { user, error } =
      type === 'LOGIN'
        ? await supabase.auth.signIn({email, password})
        : await supabase.auth.signUp({email, password})

    if (error) alert(error.message || error)
    else onLogin(user)
  }

  return (
    <div className="w-full sm:w-1/2 xl:w-1/3">
      <div className="border-teal p-8 border-t-12 bg-white mb-6 rounded-lg shadow-lg bg-white">
        <div className="mb-4">
          <label className="font-bold text-grey-darker block mb-2">Email</label>
          <input
            type="text"
            className="block appearance-none w-full bg-white border border-grey-light hover:border-grey px-2 py-2 rounded shadow"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="font-bold text-grey-darker block mb-2">Password</label>
          <input
            type="password"
            className="block appearance-none w-full bg-white border border-grey-light hover:border-grey px-2 py-2 rounded shadow"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <a
            onClick={(e) => {
              e.preventDefault()
              handleLogin('SIGNUP', email, password)
            }}
            href={'/channels'}
            className="btn-black"
          >
            Sign up
          </a>
          <a
            onClick={(e) => {
              e.preventDefault()
              handleLogin('LOGIN', email, password)
            }}
            href={'/channels'}
            className="btn-black-outline"
          >
            Login
          </a>
        </div>
      </div>
    </div>
  )
}
