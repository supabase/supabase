'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/client'
import { Button } from '@/registry/default/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/registry/default/components/ui/card'
import { Input } from '@/registry/default/components/ui/input'
import { Label } from '@/registry/default/components/ui/label'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export function UpdatePasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [hasValidSession, setHasValidSession] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async() => {
      const supabase = createClient()
      try {
        const { data: {session} } = await supabase.auth.getSession();

        if (session && session.user) {
          setHasValidSession(true)
        } else {
          setError('No valid session found. Please click the password reset link again.')
        }
      } catch (err) {
        setError('Failed to verify session. Please try again.')
      } finally {
        setSessionChecked(true)
      }
    }
    checkSession()
    }, [])

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!hasValidSession) {
      setError('No valid session found. Please click the password reset link again.')
      return
    }

    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 30 seconds')), 30000)
      })

      const updatePromise = supabase.auth.updateUser({ password })

      const { error } = await Promise.race([updatePromise, timeoutPromise]) as any
      if (error) throw error
      // Update this route to redirect to an authenticated route. The user already has an active session.
      router.push('/example/password-based-auth/protected')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!sessionChecked) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Verifying Session...</CardTitle>
            <CardDescription>Please wait while we verify your session.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!hasValidSession) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Session Error</CardTitle>
            <CardDescription>Unable to verify your session.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-500">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please click the password reset link in your email again to get a fresh session.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>Please enter your new password below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleForgotPassword}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="New password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save new password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
