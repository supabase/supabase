'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/registry/default/clients/tanstack/lib/supabase/client'
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
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

export function OTPRequestForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const supabase = createClient()

  const handleOTPRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Set this to false if you do not want the user to be automatically signed up
          shouldCreateUser: true,
        },
      })
      if (error) throw error
      // Navigate to OTP verification page
      navigate({ to: '/verify-otp', search: { email } })
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
          <CardTitle className="text-2xl">OTP Login</CardTitle>
          <CardDescription>
            Enter your email to receive a one-time password for passwordless login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleOTPRequest}>
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
                {isLoading ? 'Sending code...' : 'Send verification code'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
