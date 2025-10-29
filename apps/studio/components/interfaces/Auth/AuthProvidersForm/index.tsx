import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

import { useParams } from 'common'
import {
  ScaffoldSection,
  ScaffoldSectionDescription,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { ResourceList } from 'components/ui/Resource/ResourceList'
import { HorizontalShimmerWithIcon } from 'components/ui/Shimmers/Shimmers'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  WarningIcon,
} from 'ui'
import { getPhoneProviderValidationSchema, PROVIDERS_SCHEMAS } from '../AuthProvidersFormValidation'
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
          {authConfig?.EXTERNAL_EMAIL_ENABLED && authConfig?.MAILER_OTP_EXP > 3600 && (
            <Alert_Shadcn_
              className="flex w-full items-center justify-between my-3"
              variant="warning"
            >
              <WarningIcon />
              <div>
                <AlertTitle_Shadcn_>OTP expiry exceeds recommended threshold</AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_ className="flex flex-col gap-y-3">
                  <p>
                    We have detected that you have enabled the email provider with the OTP expiry
                    set to more than an hour. It is recommended to set this value to less than an
                    hour.
                  </p>
                  <Button asChild type="default" className="w-min" icon={<ExternalLink />}>
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
              PROVIDERS_SCHEMAS.map((provider) => {
                const providerSchema =
                  provider.title === 'Phone'
                    ? {
                        ...provider,
                        validationSchema: getPhoneProviderValidationSchema(authConfig),
                      }
                    : provider
                let isActive = false
                if (providerSchema.title === 'SAML 2.0') {
                  isActive = authConfig && (authConfig as any)['SAML_ENABLED']
                } else if (providerSchema.title === 'LinkedIn (OIDC)') {
                  isActive = authConfig && (authConfig as any)['EXTERNAL_LINKEDIN_OIDC_ENABLED']
                } else if (providerSchema.title === 'Slack (OIDC)') {
                  isActive = authConfig && (authConfig as any)['EXTERNAL_SLACK_OIDC_ENABLED']
                } else if (providerSchema.title.includes('Web3')) {
                  isActive = authConfig && (authConfig as any)['EXTERNAL_WEB3_SOLANA_ENABLED']
                } else {
                  isActive =
                    authConfig &&
                    (authConfig as any)[`EXTERNAL_${providerSchema.title.toUpperCase()}_ENABLED`]
                }
                return (
                  <ProviderForm
                    key={`provider_${providerSchema.title}`}
                    config={authConfig!}
                    provider={providerSchema as unknown as Provider}
                    isActive={isActive}
                  />
                )
              })}
          </ResourceList>
        </div>
      )}
    </ScaffoldSection>
  )
}
