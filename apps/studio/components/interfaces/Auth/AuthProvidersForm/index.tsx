import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

import { useParams } from 'common'
import {
  ScaffoldSection,
  ScaffoldSectionDescription,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { ResourceList } from 'components/ui/Resource/ResourceList'
import { HorizontalShimmerWithIcon } from 'components/ui/Shimmers'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  WarningIcon,
} from 'ui'

import {
  getPhoneProviderValidationSchema,
  PROVIDERS_SCHEMAS,
} from '../AuthProvidersFormValidation'

import type { Provider } from './AuthProvidersForm.types'
import { ProviderForm } from './ProviderForm'

export const AuthProvidersForm = () => {
  const { ref: projectRef } = useParams()

  const {
    data: authConfig,
    error: authConfigError,
    isLoading,
    isError,
    isSuccess,
  } = useAuthConfigQuery({ projectRef })

  // Memoized provider schemas
  const computedProviders = useMemo(() => {
    if (!isSuccess || !authConfig) return []

    return PROVIDERS_SCHEMAS.map((provider) => {
      if (provider.title === 'Phone') {
        return {
          ...provider,
          validationSchema: getPhoneProviderValidationSchema(authConfig),
        }
      }
      return provider
    })
  }, [isSuccess, authConfig])

  // Memoized active state
  const getIsActive = (provider: Provider, config: any) => {
    const title = provider.title

    if (title === 'SAML 2.0') return config?.SAML_ENABLED
    if (title === 'LinkedIn (OIDC)') return config?.EXTERNAL_LINKEDIN_OIDC_ENABLED
    if (title === 'Slack (OIDC)') return config?.EXTERNAL_SLACK_OIDC_ENABLED
    if (title.includes('Web3')) return config?.EXTERNAL_WEB3_SOLANA_ENABLED

    return config?.[`EXTERNAL_${title.toUpperCase()}_ENABLED`]
  }

  return (
    <ScaffoldSection isFullWidth>
      <ScaffoldSectionTitle>Auth Providers</ScaffoldSectionTitle>

      <ScaffoldSectionDescription className="mb-4">
        Authenticate your users through a suite of providers and login methods
      </ScaffoldSectionDescription>

      {isError ? (
        <AlertError
          error={authConfigError}
          subject="Failed to retrieve auth configuration for hooks"
        />
      ) : (
        <div className="-space-y-px">
          {authConfig?.EXTERNAL_EMAIL_ENABLED &&
            authConfig?.MAILER_OTP_EXP > 3600 && (
              <Alert_Shadcn_
                className="flex w-full items-center justify-between my-3"
                variant="warning"
              >
                <WarningIcon />
                <div>
                  <AlertTitle_Shadcn_>
                    OTP expiry exceeds recommended threshold
                  </AlertTitle_Shadcn_>

                  <AlertDescription_Shadcn_ className="flex flex-col gap-y-3">
                    <p>
                      Your email provider OTP expiry is set to more than an hour.
                      For better security, reduce the value to under 1 hour.
                    </p>

                    <Button
                      asChild
                      type="default"
                      className="w-min"
                      icon={<ExternalLink />}
                    >
                      <Link href="https://supabase.com/docs/guides/platform/going-into-prod#security">
                        View security recommendations
                      </Link>
                    </Button>
                  </AlertDescription_Shadcn_>
                </div>
              </Alert_Shadcn_>
            )}

          <ResourceList>
            {isLoading &&
              PROVIDERS_SCHEMAS.map((provider) => (
                <div
                  key={`provider_${provider.title}`}
                  className="py-4 px-6 border-b last:border-b-none"
                >
                  <HorizontalShimmerWithIcon />
                </div>
              ))}

            {isSuccess &&
              computedProviders.map((providerSchema) => (
                <ProviderForm
                  key={`provider_${providerSchema.title}`}
                  config={authConfig!}
                  provider={providerSchema as Provider}
                  isActive={getIsActive(providerSchema as Provider, authConfig)}
                />
              ))}
          </ResourceList>
        </div>
      )}
    </ScaffoldSection>
  )
}
