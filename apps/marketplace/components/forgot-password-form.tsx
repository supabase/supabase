'use client'

import Link from 'next/link'
import { useState } from 'react'

import { Button, cn, Input_Shadcn_, Label_Shadcn_ } from 'ui'
import { createClient } from '@/lib/supabase/client'

export function ForgotPasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })
      if (error) throw error
      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      {success ? (
        <>
          <p className="text-sm text-muted-foreground">
            If you registered using your email and password, you will receive a password reset
            email.
          </p>
          <div className="self-center text-sm">
            <Link
              href="/auth/login"
              className="underline transition text-foreground hover:text-muted-foreground"
            >
              Back to sign in
            </Link>
          </div>
        </>
      ) : (
        <form onSubmit={handleForgotPassword} className="flex flex-col gap-6">
          <div className="grid gap-2">
            <Label_Shadcn_ htmlFor="email">Email</Label_Shadcn_>
            <Input_Shadcn_
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send reset email'}
          </Button>

          <div className="self-center text-sm">
            <span className="text-muted-foreground">Already have an account?</span>{' '}
            <Link
              href="/auth/login"
              className="underline transition text-foreground hover:text-muted-foreground"
            >
              Sign in
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
