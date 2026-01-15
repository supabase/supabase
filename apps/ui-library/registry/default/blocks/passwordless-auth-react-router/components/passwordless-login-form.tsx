'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/registry/default/clients/react-router/lib/supabase/client'
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
import { useNavigate } from 'react-router'
import { useState } from 'react'

type LoginMethod = 'magic-link' | 'otp'

interface PasswordlessLoginFormProps extends React.ComponentPropsWithoutRef<'div'> {
  method?: LoginMethod
}

export function PasswordlessLoginForm({
  className,
  method = 'magic-link',
  ...props
}: PasswordlessLoginFormProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMagicLinkSent, setIsMagicLinkSent] = useState(false)
  const navigate = useNavigate()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setIsMagicLinkSent(false)

    try {
      if (method === 'magic-link') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
          },
        })
        if (error) throw error
        setIsMagicLinkSent(true)
      } else {
        // OTP method
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
          },
        })
        if (error) throw error
        // Navigate to OTP verification page
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`)
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Sign in or create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          {isMagicLinkSent ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <p className="font-semibold">Check your email!</p>
              <p className="mt-1">
                We&apos;ve sent a magic link to <span className="font-medium">{email}</span>. Click
                the link in the email to sign in.
              </p>
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => {
                  setIsMagicLinkSent(false)
                  setEmail('')
                }}
              >
                Send another link
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading
                    ? method === 'magic-link'
                      ? 'Sending magic link...'
                      : 'Sending code...'
                    : method === 'magic-link'
                      ? 'Send magic link'
                      : 'Send verification code'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
