'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button, Input } from 'ui'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<any>()
  const [view, setView] = useState('sign-in')
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })
    setView('check-email')
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      setError(error)
      console.log(error)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col content-center justify-center gap-2 px-8">
      <Link
        href="/"
        className="bg-btn-background hover:bg-btn-background-hover group absolute left-8 top-8 flex items-center rounded-md px-4 py-2 text-sm text-foreground no-underline"
      >
        Back
      </Link>
      {view === 'check-email' ? (
        <p className="text-center text-foreground">
          Check <span className="font-bold">{email}</span> to continue signing up
        </p>
      ) : (
        <form
          className="flex w-full flex-1 flex-col justify-center gap-2 text-foreground"
          onSubmit={view === 'sign-in' ? handleSignIn : handleSignUp}
        >
          <label className="text-md" htmlFor="email">
            Email
          </label>
          <Input
            name="email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            placeholder="you@example.com"
          />
          <label className="text-md" htmlFor="password">
            Password
          </label>
          <Input
            className="mb-6 "
            type="password"
            name="password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            placeholder="••••••••"
          />
          {error && <p className="mb-4 text-center text-sm text-red-500">{error.message}</p>}
          {view === 'sign-in' && (
            <>
              <Button>Sign In</Button>
              <p className="text-center text-sm">
                Don't have an account?
                <button className="ml-1 underline" onClick={() => setView('sign-up')}>
                  Sign Up Now
                </button>
              </p>
            </>
          )}
          {view === 'sign-up' && (
            <>
              <Button>Sign Up</Button>
              <p className="text-center text-sm">
                Already have an account?
                <button className="ml-1 underline" onClick={() => setView('sign-in')}>
                  Sign In Now
                </button>
              </p>
            </>
          )}
        </form>
      )}
    </div>
  )
}
