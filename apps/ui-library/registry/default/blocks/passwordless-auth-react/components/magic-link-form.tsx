'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/registry/default/clients/react/lib/supabase/client'
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
import { useState } from 'react'

export function MagicLinkForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const supabase = createClient()

  const handleMagicLinkRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setIsSuccess(false)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Set this to false if you do not want the user to be automatically signed up
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      })
      if (error) throw error
      setIsSuccess(true)
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
          <CardTitle className="text-2xl">Magic Link Login</CardTitle>
          <CardDescription>
            Enter your email to receive a magic link for passwordless login
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <p className="font-semibold">Check your email!</p>
              <p className="mt-1">
                We&apos;ve sent a magic link to <span className="font-medium">{email}</span>. Click
                the link in the email to sign in.
              </p>
            </div>
          ) : (
            <form onSubmit={handleMagicLinkRequest}>
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
                  {isLoading ? 'Sending magic link...' : 'Send magic link'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
