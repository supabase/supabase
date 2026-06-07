import { useRouter } from 'next/router'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'

import SignInLayout from '@/components/layouts/SignInLayout/SignInLayout'
import type { NextPageWithLayout } from '@/types'

const inputClass =
  'flex h-[34px] w-full rounded-md border border-control bg-foreground/[.026] px-3 text-sm text-foreground placeholder:text-foreground-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background-control focus-visible:ring-offset-2 focus-visible:ring-offset-foreground-muted'

// [console fork] Invited-user onboarding. Public sign-up is disabled, but a person
// with a pending invitation must still be able to create their account. This calls
// the dedicated /invite/accept-new endpoint (which creates the user + joins the org
// in one transaction, bypassing the blocked public sign-up).
const AcceptInvitePage: NextPageWithLayout = () => {
  const router = useRouter()
  const invitationId = (router.query.invitationId as string) ?? ''

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [needsSignIn, setNeedsSignIn] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invitationId) return toast.error('Missing invitation. Please use the link from your email.')
    if (name.trim().length < 1) return toast.error('Please enter your name.')
    if (password.length < 8) return toast.error('Password must be at least 8 characters.')

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/auth/invite/accept-new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, name: name.trim(), password }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success('Welcome! Your account is ready.')
        window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/organizations`
        return
      }
      // Existing account for this email -> they should sign in and accept instead.
      if (res.status === 409) {
        setNeedsSignIn(true)
        toast.error(data?.message ?? 'An account already exists for this email.')
      } else {
        toast.error(data?.message ?? 'Could not accept the invitation. It may have expired.')
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Something went wrong accepting the invitation.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // router.query is empty until the router is ready on the client; don't flash the
  // "invalid" state before the invitationId has hydrated.
  if (!router.isReady) {
    return <div className="text-sm text-foreground-light">Loading your invitation…</div>
  }

  if (!invitationId) {
    return (
      <div className="text-sm text-foreground-light">
        This invitation link is invalid or incomplete. Please use the link from your invitation
        email, or{' '}
        <Link href="/sign-in" className="underline text-foreground">
          sign in
        </Link>
        .
      </div>
    )
  }

  if (needsSignIn) {
    return (
      <div className="flex flex-col gap-4 text-sm">
        <p className="text-foreground-light">
          An account already exists for this email. Sign in, then open your invitation link again to
          join the organization.
        </p>
        <Button asChild size="large" className="w-full justify-center">
          <Link href={`/sign-in?returnTo=/accept-invite?invitationId=${invitationId}`}>Sign in</Link>
        </Button>
      </div>
    )
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
      <Button
        htmlType="submit"
        size="large"
        loading={isSubmitting}
        disabled={isSubmitting}
        className="w-full justify-center"
      >
        Accept invitation
      </Button>
    </form>
  )
}

AcceptInvitePage.getLayout = (page) => (
  <SignInLayout heading="Accept your invitation" subheading="Create your account to join">
    {page}
  </SignInLayout>
)

export default AcceptInvitePage
