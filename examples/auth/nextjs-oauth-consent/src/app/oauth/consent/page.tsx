'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface AuthorizationDetails {
  client?: {
    client_id?: string
    client_name?: string
    logo_uri?: string
  }
  scopes?: string[]
  redirect_uri?: string
}

function ConsentForm() {
  const searchParams = useSearchParams()
  const authorizationId = searchParams.get('authorization_id')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authDetails, setAuthDetails] = useState<AuthorizationDetails | null>(null)
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function init() {
      if (!authorizationId) {
        setError('Missing authorization_id parameter')
        setLoading(false)
        return
      }

      try {
        // Check if user is logged in
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          // User not logged in - redirect to OAuth provider, then back here
          const currentUrl = window.location.href
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: currentUrl,
            },
          })
          if (error) throw error
          return
        }

        setUser({ email: session.user.email })

        // Get authorization details from Supabase
        const { data, error: authError } =
          await supabase.auth.oauth.getAuthorizationDetails(authorizationId)

        if (authError) {
          throw authError
        }

        setAuthDetails(data as unknown as AuthorizationDetails)
      } catch (err) {
        console.error('Error initializing consent page:', err)
        setError(err instanceof Error ? err.message : 'Failed to load authorization details')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [authorizationId])

  const handleAllow = async () => {
    if (!authorizationId) return

    setSubmitting(true)
    try {
      const { error } = await supabase.auth.oauth.approveAuthorization(authorizationId)
      if (error) throw error
      // Supabase will handle the redirect automatically
    } catch (err) {
      console.error('Error approving authorization:', err)
      setError(err instanceof Error ? err.message : 'Failed to approve authorization')
      setSubmitting(false)
    }
  }

  const handleDeny = async () => {
    if (!authorizationId) return

    setSubmitting(true)
    try {
      const { error } = await supabase.auth.oauth.denyAuthorization(authorizationId)
      if (error) throw error
      // Supabase will handle the redirect automatically
    } catch (err) {
      console.error('Error denying authorization:', err)
      setError(err instanceof Error ? err.message : 'Failed to deny authorization')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authorization details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="text-red-500 text-4xl mb-4">!</div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Authorization Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  const clientName =
    authDetails?.client?.client_name || authDetails?.client?.client_id || 'Unknown Application'
  const scopes = authDetails?.scopes || []

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-5">
      <div className="bg-white rounded-xl shadow-lg p-10 max-w-md w-full">
        {user?.email && <p className="text-sm text-gray-500 mb-4">Logged in as {user.email}</p>}

        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Authorize Application</h1>
        <p className="text-gray-600 mb-6 break-all">{clientName}</p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="text-sm text-gray-600 mb-3">This application is requesting access to:</h2>
          <ul className="space-y-2">
            {scopes.length > 0 ? (
              scopes.map((scope) => (
                <li key={scope} className="flex items-center gap-2 text-gray-800">
                  <span className="text-green-500 font-bold">*</span>
                  {scope}
                </li>
              ))
            ) : (
              <>
                <li className="flex items-center gap-2 text-gray-800">
                  <span className="text-green-500 font-bold">*</span>
                  Access your account information
                </li>
                <li className="flex items-center gap-2 text-gray-800">
                  <span className="text-green-500 font-bold">*</span>
                  Use MCP tools on your behalf
                </li>
              </>
            )}
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDeny}
            disabled={submitting}
            className="flex-1 py-3 px-6 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {submitting ? '...' : 'Deny'}
          </button>
          <button
            onClick={handleAllow}
            disabled={submitting}
            className="flex-1 py-3 px-6 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {submitting ? '...' : 'Allow'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ConsentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      }
    >
      <ConsentForm />
    </Suspense>
  )
}
