import { cn } from 'ui'

import { SignInWithSSOButton } from './SignInSSOForm'
import { SignInWithCustom } from './SignInWithCustom'
import { SignInWithExternalProvider } from './SignInWithExternalProvider'
import { useCustomContent } from '@/hooks/custom-content/useCustomContent'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { type ExternalIdentityProviderConfig } from '@/lib/external-identity-providers'

export const SignInOptions = ({
  providers,
  dividerBgClass = 'bg-studio',
}: {
  providers: ExternalIdentityProviderConfig[]
  dividerBgClass?: string
}) => {
  const {
    dashboardAuthSignInWithSso: signInWithSsoEnabled,
    dashboardAuthSignInWithEmail: signInWithEmailEnabled,
  } = useIsFeatureEnabled(['dashboard_auth:sign_in_with_sso', 'dashboard_auth:sign_in_with_email'])

  const {
    dashboardAuthCustomProvider: customProvider,
    dashboardAuthCustomProviders: customProvidersNew,
  } = useCustomContent(['dashboard_auth:custom_provider', 'dashboard_auth:custom_providers'])

  // [Joshen] This is just for backward compatibility - singular customProvider needs to be deprecated subsequently
  // Just need to remove customProvider and rename customProvidersNew to customProviders
  const customProviders = customProvidersNew ?? (customProvider ? [customProvider] : [])

  const showOrDivider =
    (providers.length > 0 || signInWithSsoEnabled || customProviders.length > 0) &&
    signInWithEmailEnabled

  return (
    <>
      {Array.isArray(customProviders) &&
        customProviders.map((providerName: string) => (
          <SignInWithCustom key={providerName} providerName={providerName} />
        ))}

      {providers.map((provider) => (
        <SignInWithExternalProvider key={provider.id} provider={provider} />
      ))}

      {signInWithSsoEnabled && <SignInWithSSOButton />}

      {showOrDivider && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-strong" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className={cn('px-2 text-sm text-foreground', dividerBgClass)}>or</span>
          </div>
        </div>
      )}
    </>
  )
}
