'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/client'
import { Button } from '@/registry/default/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/registry/default/components/ui/card'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ScopeList } from './scope-list'

interface AuthorizationDetails {
  client?: {
    client_id?: string
    client_name?: string
    logo_uri?: string
  }
  scopes?: string[]
  redirect_uri?: string
}

export function ConsentForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
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

      const supabase = createClient()

      try {
        // Check if user is logged in
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          // User not logged in - redirect to OAuth provider, then back here
          const currentUrl = window.location.href
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github', // Change this to your preferred provider
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

    const supabase = createClient()
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

    const supabase = createClient()
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
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
              <p className="text-sm text-muted-foreground">Loading authorization details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Authorization Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const clientName =
    authDetails?.client?.client_name || authDetails?.client?.client_id || 'Unknown Application'
  const scopes = authDetails?.scopes || []

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Authorize Application</CardTitle>
          <CardDescription className="break-all">{clientName}</CardDescription>
          {user?.email && (
            <p className="text-xs text-muted-foreground">Logged in as {user.email}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4">
            <p className="mb-3 text-sm font-medium">This application is requesting access to:</p>
            <ScopeList scopes={scopes} />
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handleDeny} disabled={submitting}>
            {submitting ? '...' : 'Deny'}
          </Button>
          <Button className="flex-1" onClick={handleAllow} disabled={submitting}>
            {submitting ? '...' : 'Allow'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
