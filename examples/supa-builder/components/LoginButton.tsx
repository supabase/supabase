'use client'

/**
 * LoginButton Component
 *
 * Client component that handles OAuth login flow for various providers.
 */

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

type Provider = 'google' | 'azure' | 'github' | 'gitlab'

interface LoginButtonProps {
  provider: Provider
}

const providerConfig = {
  google: {
    name: 'Google',
    icon: '🔐',
    color: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300',
  },
  azure: {
    name: 'Azure AD',
    icon: '🔷',
    color: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  github: {
    name: 'GitHub',
    icon: '⚫',
    color: 'bg-gray-800 hover:bg-gray-900 text-white',
  },
  gitlab: {
    name: 'GitLab',
    icon: '🦊',
    color: 'bg-orange-600 hover:bg-orange-700 text-white',
  },
}

export default function LoginButton({ provider }: LoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const config = providerConfig[provider]

  const handleLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }

      // OAuth flow initiated, user will be redirected
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'Failed to sign in')
      setIsLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className={`w-full px-6 py-3 rounded-lg font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 ${config.color}`}
      >
        <span className="text-xl">{config.icon}</span>
        {isLoading ? `Signing in...` : `Continue with ${config.name}`}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
