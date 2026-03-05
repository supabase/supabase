'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button, cn, Input_Shadcn_, Label_Shadcn_ } from 'ui'

import { createClient } from '@/lib/supabase/client'

export function UpdatePasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({ password })
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
            Your password has been updated. You can now sign in with your new password.
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
            <Label_Shadcn_ htmlFor="password">New password</Label_Shadcn_>
            <Input_Shadcn_
              id="password"
              type="password"
              placeholder="New password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button htmlType="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save new password'}
          </Button>

          <div className="self-center text-sm">
            <span className="text-muted-foreground">Remembered your password?</span>{' '}
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
