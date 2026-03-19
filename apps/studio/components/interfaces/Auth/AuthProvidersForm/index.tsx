import { ExternalLink, Plus } from 'lucide-react'
import Link from 'next/link'
import { useQueryState } from 'nuqs'
import { useState } from 'react'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { ResourceList } from 'components/ui/Resource/ResourceList'
import { HorizontalShimmerWithIcon } from 'components/ui/Shimmers'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { BASE_PATH } from 'lib/constants'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  WarningIcon,
} from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { getPhoneProviderValidationSchema, PROVIDERS_SCHEMAS } from '../AuthProvidersFormValidation'
import type { Provider } from './AuthProvidersForm.types'
import { ProviderForm } from './ProviderForm'

function getIsActive(providerTitle: string, authConfig: any): boolean {
  if (providerTitle === 'SAML 2.0') return !!authConfig?.['SAML_ENABLED']
  if (providerTitle === 'LinkedIn (OIDC)') return !!authConfig?.['EXTERNAL_LINKEDIN_OIDC_ENABLED']
  if (providerTitle === 'Slack (OIDC)') return !!authConfig?.['EXTERNAL_SLACK_OIDC_ENABLED']
  if (providerTitle.includes('Web3')) return !!authConfig?.['EXTERNAL_WEB3_SOLANA_ENABLED']
  if (providerTitle.includes('X / Twitter (OAuth 2.0)')) return !!authConfig?.['EXTERNAL_X_ENABLED']
  if (providerTitle === 'Twitter (Deprecated)') return !!authConfig?.['EXTERNAL_TWITTER_ENABLED']
  return !!authConfig?.[`EXTERNAL_${providerTitle.toUpperCase()}_ENABLED`]
}

// Fixed positions for inactive provider icons scattered around the empty state
const ICON_POSITIONS = [
  { top: '12%', left: '8%', size: 24, rotate: 0, opacity: 0.3 },
  { top: '10%', left: '28%', size: 20, rotate: 0, opacity: 0.22 },
  { top: '14%', right: '10%', size: 22, rotate: 0, opacity: 0.28 },
  { top: '42%', left: '4%', size: 18, rotate: 0, opacity: 0.2 },
  { top: '42%', right: '5%', size: 20, rotate: 0, opacity: 0.25 },
  { bottom: '14%', left: '9%', size: 22, rotate: 0, opacity: 0.28 },
  { bottom: '12%', left: '32%', size: 18, rotate: 0, opacity: 0.2 },
  { bottom: '14%', right: '12%', size: 24, rotate: 0, opacity: 0.3 },
  { top: '24%', left: '18%', size: 16, rotate: 0, opacity: 0.16 },
  { top: '22%', right: '26%', size: 16, rotate: 0, opacity: 0.18 },
  { bottom: '26%', left: '20%', size: 14, rotate: 0, opacity: 0.16 },
  { bottom: '24%', right: '20%', size: 14, rotate: 0, opacity: 0.18 },
]

function InactiveProvidersEmptyState({
  providers,
}: {
  providers: { iconKey: string; title: string }[]
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [, setUrlProvider] = useQueryState('provider', { defaultValue: '' })

  return (
    <>
      <div className="relative flex items-center justify-center rounded-lg border border-dashed border-border h-52 overflow-hidden">
        {providers.slice(0, ICON_POSITIONS.length).map((provider, i) => {
          const pos = ICON_POSITIONS[i]
          return (
            <div
              key={provider.title}
              className="absolute select-none pointer-events-none"
              style={{
                top: pos.top,
                left: (pos as any).left,
                right: (pos as any).right,
                bottom: pos.bottom,
                opacity: pos.opacity,
              }}
            >
              <img
                src={`${BASE_PATH}/img/icons/${provider.iconKey}.svg`}
                width={pos.size}
                height={pos.size}
                alt=""
              />
            </div>
          )
        })}
        <div className="relative flex flex-col items-center gap-3 z-10">
          <p className="text-sm text-foreground-lighter">No additional providers enabled</p>
          <Button type="default" icon={<Plus size={14} />} onClick={() => setDialogOpen(true)}>
            Add provider
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add a provider</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 py-2">
            {providers.map((provider) => (
              <button
                key={provider.title}
                type="button"
                onClick={() => {
                  setDialogOpen(false)
                  setUrlProvider(provider.title)
                }}
                className="flex flex-col items-center gap-2 rounded-md border border-border p-3 hover:bg-surface-200 transition-colors text-left"
              >
                <img
                  src={`${BASE_PATH}/img/icons/${provider.iconKey}.svg`}
                  width={24}
                  height={24}
                  alt=""
                />
                <span className="text-xs text-foreground-light text-center leading-tight">
                  {provider.title}
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export const AuthProvidersForm = () => {
  const { ref: projectRef } = useParams()
  const {
    data: authConfig,
    error: authConfigError,
    isPending: isLoading,
    isError,
    isSuccess,
  } = useAuthConfigQuery({ projectRef })

  const providersWithStatus = isSuccess
    ? PROVIDERS_SCHEMAS.map((provider) => {
        const providerSchema =
          provider.title === 'Phone'
            ? { ...provider, validationSchema: getPhoneProviderValidationSchema(authConfig) }
            : provider
        return {
          providerSchema,
          isActive: getIsActive(providerSchema.title, authConfig),
        }
      })
    : []

  const activeProviders = providersWithStatus.filter((p) => p.isActive)
  const inactiveProviders = providersWithStatus.filter((p) => !p.isActive)

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Auth Providers</PageSectionTitle>
          <PageSectionDescription>
            Authenticate your users through a suite of providers and login methods
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        {isError ? (
          <AlertError
            error={authConfigError}
            subject="Failed to retrieve auth configuration for hooks"
          />
        ) : (
          <div className="space-y-4">
            {authConfig?.EXTERNAL_EMAIL_ENABLED && authConfig?.MAILER_OTP_EXP > 3600 && (
              <Alert_Shadcn_
                className="flex w-full items-center justify-between"
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

            <ResourceList className="divide-y divide-border">
              {isLoading &&
                PROVIDERS_SCHEMAS.slice(0, 3).map((provider) => (
                  <div key={provider.title} className="py-4 px-6">
                    <HorizontalShimmerWithIcon />
                  </div>
                ))}
              {activeProviders.map(({ providerSchema, isActive }) => (
                <ProviderForm
                  key={`provider_${providerSchema.title}`}
                  config={authConfig!}
                  provider={providerSchema as unknown as Provider}
                  isActive={isActive}
                />
              ))}
            </ResourceList>

            {isSuccess && inactiveProviders.length > 0 && (
              <InactiveProvidersEmptyState
                providers={inactiveProviders.map((p) => ({
                  iconKey: p.providerSchema.misc.iconKey,
                  title: p.providerSchema.title,
                }))}
              />
            )}

            {/* Render inactive ProviderForms hidden so their sheets can still open via URL */}
            <div className="hidden">
              {isSuccess &&
                inactiveProviders.map(({ providerSchema, isActive }) => (
                  <ProviderForm
                    key={`provider_${providerSchema.title}`}
                    config={authConfig!}
                    provider={providerSchema as unknown as Provider}
                    isActive={isActive}
                  />
                ))}
            </div>
          </div>
        )}
      </PageSectionContent>
    </PageSection>
  )
}
