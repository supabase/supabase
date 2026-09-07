import { supabase } from 'lib/Store'
import { useEffect, useState } from 'react'

const Home = () => {
  const [session, setSession] = useState(null)
  const [mode, setMode] = useState('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsLoading(true)
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

    setIsLoading(false)
  }

  const handleGitHubSignIn = async () => {
    setIsLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/` },
    })
    if (error) setError(error.message)
    setIsLoading(false)
  }

  if (!session) {
    return (
      <div className="w-full h-full flex justify-center items-center p-4 bg-gray-300">
        <div className="w-full sm:w-1/2 xl:w-1/3">
          <div className="border-teal p-8 border-t-12 bg-white mb-6 rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold mb-4">
              {mode === 'sign-in' ? 'Sign in' : 'Sign up'}
            </h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="border rounded px-2 py-1"
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
                  className="border rounded px-2 py-1"
                />
              </label>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white rounded px-3 py-2 disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : mode === 'sign-in' ? 'Sign in' : 'Sign up'}
              </button>
            </form>

            <div className="flex items-center gap-2 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-500">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button
              type="button"
              onClick={handleGitHubSignIn}
              disabled={isLoading}
              className="w-full bg-gray-900 text-white rounded px-3 py-2"
            >
              {isLoading ? 'Loading...' : 'Continue with GitHub'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
                setError(null)
                setMessage(null)
              }}
              className="mt-4 text-sm text-blue-600 underline"
            >
              {mode === 'sign-in' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </button>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            {message && <p className="mt-3 text-sm text-gray-700">{message}</p>}
          </div>
        </div>
      </div>
    )
  } else {
    return <div>Logged in!</div>
  }
}

export default Home
