import React, { useState } from 'react'
import JSONInput from 'react-json-editor-ajrm'
import locale from 'react-json-editor-ajrm/locale/en'

import { functionsList } from './functionsList'
import { supabase } from './utils/supabaseClient'
import { useUser } from './utils/userContext'

const sampleObject = { name: 'world' }

function AuthForm() {
  const [mode, setMode] = useState('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (mode === 'sign-in') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      })
      if (error) {
        setError(error.message)
      } else if (data.user && !data.session) {
        setMessage('Check your email for a confirmation link to complete sign up.')
      }
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="rounded border border-gray-300 px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Password
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
          className="rounded border border-gray-300 px-2 py-1"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-green-500 py-2 px-4 font-bold text-white hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Loading...' : mode === 'sign-in' ? 'Sign in' : 'Sign up'}
      </button>
      <button
        type="button"
        onClick={() => {
          setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
          setError(null)
          setMessage(null)
        }}
        className="text-sm text-blue-600 underline"
      >
        {mode === 'sign-in' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-gray-700">{message}</p>}
    </form>
  )
}

function App() {
  const { user } = useUser()
  const [supaFunction, setSupaFunction] = useState(functionsList[0])
  const [requestJson, setRequestJson] = useState(sampleObject)
  const [responseJson, setResponseJson] = useState({})

  const invokeFunction = async () => {
    setResponseJson({ loading: true })
    const { data, error } = await supabase.functions.invoke(supaFunction, {
      body: JSON.stringify(requestJson),
    })
    if (error) alert(error)
    setResponseJson(data)
  }

  return (
    <div className="p-2">
      <h2 className="mb-2 text-4xl">Supabase Egde Functions Test Client</h2>
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="p-2">
          <h3 className="mb-2 text-3xl">Request</h3>
          <h4 className="text-2xl">Function</h4>
          <select
            className="form-select m-0focus:border-green-600
              block
              w-full
              appearance-none
              rounded
              border
              border-solid
              border-gray-300
              bg-white bg-clip-padding bg-no-repeat
              px-3 py-1.5 text-base
              font-normal
              text-gray-700
              transition
              ease-in-out
              focus:bg-white focus:text-gray-700 focus:outline-none"
            onChange={(e) => setSupaFunction(e.target.value)}
          >
            {functionsList.map((func) => (
              <option value={func} key={func}>
                {func}
              </option>
            ))}
          </select>
          <p className="mb-2">
            Note: when using locally, this selection doesn't have any effect and the function that's
            currently being served via the CLI is called instead.
          </p>
          <h4 className="mb-2 text-2xl">Body</h4>
          <JSONInput
            onChange={({ jsObject }) => setRequestJson(jsObject)}
            placeholder={sampleObject}
            locale={locale}
            height="100"
            width="100%"
          />
          <button
            className="mt-2 rounded bg-green-500 py-2 px-4 font-bold text-white hover:bg-green-700"
            onClick={invokeFunction}
          >
            Invoke Function
          </button>
        </div>
        <div className="p-2">
          <h3 className="mb-2 text-3xl">Response</h3>
          <pre className="bg-gray-300 p-2	">{JSON.stringify(responseJson, null, 2)}</pre>
        </div>
        <div className="p-2">
          <h3 className="mb-2 text-3xl">Log in to see RLS in action</h3>
          {user ? (
            <div>
              <h4 className="mb-2 text-2xl">{`Logged in as ${user.email}`}</h4>
              <button
                className="rounded bg-green-500 py-2 px-4 font-bold text-white hover:bg-green-700"
                onClick={() => supabase.auth.signOut()}
              >
                Sign out
              </button>
            </div>
          ) : (
            <AuthForm />
          )}
        </div>
      </div>
    </div>
  )
}

export default App
