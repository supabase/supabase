import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'

import SignInLayout from '@/components/layouts/SignInLayout/SignInLayout'
import type { NextPageWithLayout } from '@/types'

const inputClass =
  'flex h-[34px] w-full rounded-md border border-control bg-foreground/[.026] px-3 text-sm text-foreground placeholder:text-foreground-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background-control focus-visible:ring-offset-2 focus-visible:ring-offset-foreground-muted'

// [console fork] First-run setup: creates the first admin account for a fresh
// self-hosted console (the only way to create an account — public sign-up is off).
// Redirects to sign-in once the instance is already installed.
const InstallPage: NextPageWithLayout = () => {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/auth/install/status')
      .then((r) => (r.ok ? r.json() : { installed: false }))
      .then((d) => {
        if (!active) return
        if (d?.installed) router.replace('/sign-in')
        else setChecking(false)
      })
      .catch(() => active && setChecking(false))
    return () => {
      active = false
    }
  }, [router])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim().length < 1) return toast.error('Please enter your name.')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast.error('Enter a valid email.')
    if (password.length < 8) return toast.error('Password must be at least 8 characters.')
    if (password !== confirm) return toast.error('Passwords do not match.')

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/auth/install/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success('Your console is ready.')
        window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/organizations`
        return
      }
      toast.error(data?.message ?? 'Failed to set up the console.')
    } catch (err: any) {
      toast.error(err?.message ?? 'Something went wrong during setup.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (checking) {
    return <div className="text-sm text-foreground-light">Checking installation status…</div>
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm text-foreground">
          Full name
        </label>
        <input
          id="name"
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Doe"
          autoComplete="name"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm text-foreground">
          Email
        </label>
        <input
          id="email"
          type="email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm text-foreground">
          Password
        </label>
        <input
          id="password"
          type="password"
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
        />
        <p className="text-xs text-foreground-lighter">At least 8 characters.</p>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="confirm" className="text-sm text-foreground">
          Confirm password
        </label>
        <input
          id="confirm"
          type="password"
          className={inputClass}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
        />
      </div>
      <Button
        htmlType="submit"
        size="large"
        loading={isSubmitting}
        disabled={isSubmitting}
        className="w-full justify-center"
      >
        Create admin account
      </Button>
    </form>
  )
}

InstallPage.getLayout = (page) => (
  <SignInLayout heading="Set up your console" subheading="Create the first administrator account">
    {page}
  </SignInLayout>
)

export default InstallPage
