'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/client'
import { Button } from '@/registry/default/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/registry/default/components/ui/card'
import { Link } from '@/registry/default/components/ui/link'

export default function Page() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const verifyOtp = async () => {
      const supabase = createClient()
      const code = searchParams.get('code')
      const next = searchParams.get('next') || '/example/magic-auth/protected'

      if (!code) {
        setError('No verification code found')
        setIsLoading(false)
        return
      }

      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) throw error

        router.push(next)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Verification failed')
        setIsLoading(false)
      }
    }

    verifyOtp()
  }, [searchParams, router])

  if (isLoading && !error) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader>
              <CardTitle>Verifying...</CardTitle>
              <CardDescription>Please wait while we verify your email</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Verification failed</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/magic-link" className="text-sm underline underline-offset-4">
                Back to login
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}
