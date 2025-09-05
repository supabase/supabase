'use client'

import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/client'
import { Button } from '@/registry/default/components/ui/button'
import { type Provider } from '@supabase/supabase-js'
import { useState } from 'react'

export function SocialLoginButton({ label, provider }: { label: string; provider: Provider }) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSocialLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/oauth?next=/protected`,
        },
      })

      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSocialLogin}>
      <div className="flex flex-col gap-6">
        {error && <p className="text-sm text-destructive-500">{error}</p>}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Logging in...' : `Continue with ${label}`}
        </Button>
      </div>
    </form>
  )
}
