import type { Provider } from '@supabase/auth-js'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'

import { LastSignInWrapper } from './LastSignInWrapper'
import { IdentityProviderIcon } from '@/components/ui/ProviderIcon'
import { useLastSignIn } from '@/hooks/misc/useLastSignIn'
import { captureCriticalError } from '@/lib/error-reporting'
import {
  buildProviderAuthRedirect,
  getProviderDisplay,
  type ExternalIdentityProviderConfig,
} from '@/lib/external-identity-providers'
import { getErrorMessage } from '@/lib/get-error-message'
import { auth, buildPathWithParams } from '@/lib/gotrue'

interface SignInWithExternalProviderProps {
  provider: ExternalIdentityProviderConfig
  /** Overrides the default "Continue with {provider}" button label (e.g. a focused "Continue"). */
  label?: string
}

export const SignInWithExternalProvider = ({
  provider,
  label,
}: SignInWithExternalProviderProps) => {
  const [loading, setLoading] = useState(false)
  const [, setLastSignInUsed] = useLastSignIn()

  async function handleSignIn() {
    setLoading(true)

    try {
      // Redirects to /sign-in-mfa to check if the user has MFA set up before entering the dashboard
      const redirectTo = buildPathWithParams(buildProviderAuthRedirect(provider.id))

      const { error } = await auth.signInWithOAuth({
        // Configured external providers may include custom provider identifiers.
        provider: provider.authProvider as Provider,
        options: { redirectTo, scopes: provider.scopes },
      })

      if (error) throw error
      setLastSignInUsed(provider.id)
    } catch (error: unknown) {
      const message = getErrorMessage(error) ?? 'Unknown error'
      toast.error(`Failed to sign in via ${provider.displayName}: ${message}`)
      captureCriticalError(
        error instanceof Error ? error : new Error(message),
        `sign in via ${provider.displayName}`
      )
      setLoading(false)
    }
  }

  return (
    <LastSignInWrapper type={provider.id}>
      <Button
        block
        onClick={handleSignIn}
        // size 20 matches the loading spinner so the text doesn't shift while loading
        icon={<IdentityProviderIcon display={getProviderDisplay(provider.id)} size={20} />}
        size="large"
        variant="outline"
        loading={loading}
      >
        {label ?? `Continue with ${provider.displayName}`}
      </Button>
    </LastSignInWrapper>
  )
}
