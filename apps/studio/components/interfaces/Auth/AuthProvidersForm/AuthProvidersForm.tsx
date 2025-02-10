import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { toast } from 'sonner'

import { useParams } from 'common'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { HorizontalShimmerWithIcon } from 'components/ui/Shimmers/Shimmers'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { BASE_PATH } from 'lib/constants'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  WarningIcon,
  Sheet,
  SheetContent,
  Badge,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  Form_Shadcn_,
} from 'ui'
import { ResourceList } from 'components/ui/Resource/ResourceList'
import { ResourceItem } from 'components/ui/Resource/ResourceItem'
import { getPhoneProviderValidationSchema, PROVIDERS_SCHEMAS } from '../AuthProvidersFormValidation'
import { ProviderCollapsibleClasses } from './AuthProvidersForm.constants'
import ProviderForm from './ProviderForm'
import { SectionHeader } from 'components/layouts/PageLayout'
import { DocsButton } from 'components/ui/DocsButton'
import type { Provider } from './AuthProvidersForm.types'

const generateInitialValues = (provider: Provider, config: any) => {
  const doubleNegativeKeys = ['MAILER_AUTOCONFIRM', 'SMS_AUTOCONFIRM']
  const initialValues: { [x: string]: string | boolean } = {}

  Object.keys(provider.properties).forEach((key) => {
    const isDoubleNegative = doubleNegativeKeys.includes(key)

    if (provider.title === 'SAML 2.0') {
      const configValue = (config as any)[key]
      initialValues[key] = configValue || (provider.properties[key].type === 'boolean' ? false : '')
    } else {
      if (isDoubleNegative) {
        initialValues[key] = !(config as any)[key]
      } else {
        const configValue = (config as any)[key]
        initialValues[key] = configValue
          ? configValue
          : provider.properties[key].type === 'boolean'
            ? false
            : ''
      }
    }
  })

  return initialValues
}

const AuthProvidersForm = () => {
  const { ref: projectRef } = useParams()
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const { mutate: updateAuthConfig, isLoading: isUpdatingConfig } = useAuthConfigUpdateMutation()

  const {
    isLoading,
    error: authConfigError,
    isError,
    data: authConfig,
    isSuccess,
  } = useAuthConfigQuery({ projectRef })

  const activeProvider = selectedProvider
    ? PROVIDERS_SCHEMAS.find((provider) => provider.title === selectedProvider)
    : null

  const activeProviderSchema =
    activeProvider?.title === 'Phone' && authConfig
      ? { ...activeProvider, validationSchema: getPhoneProviderValidationSchema(authConfig) }
      : activeProvider

  const form = useForm({
    defaultValues: activeProviderSchema
      ? generateInitialValues(activeProviderSchema, authConfig)
      : {},
  })

  useEffect(() => {
    if (activeProviderSchema) {
      form.reset(generateInitialValues(activeProviderSchema, authConfig))
    }
  }, [activeProviderSchema])

  const onSubmit = (values: any) => {
    const doubleNegativeKeys = ['MAILER_AUTOCONFIRM', 'SMS_AUTOCONFIRM']
    const payload = { ...values }

    Object.keys(values).map((x: string) => {
      if (doubleNegativeKeys.includes(x)) payload[x] = !values[x]
      if (payload[x] === '') payload[x] = null
    })

    updateAuthConfig(
      { projectRef: projectRef!, config: payload },
      {
        onSuccess: () => {
          setSelectedProvider(null)
          toast.success('Successfully updated settings')
        },
      }
    )
  }

  if (!authConfig) return null

  return (
    <div>
      <SectionHeader
        title="Auth Providers"
        subtitle="Authenticate your users through a suite of providers and login methods"
      />

      <div className="space-y-4">
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
                  We have detected that you have enabled the email provider with the OTP expiry set
                  to more than an hour. It is recommended to set this value to less than an hour.
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
        {isLoading && (
          <div className="space-y-2">
            {PROVIDERS_SCHEMAS.map((provider) => (
              <div
                key={`provider_${provider.title}`}
                className="border rounded-md border-strong px-6 py-4"
              >
                <HorizontalShimmerWithIcon />
              </div>
            ))}
          </div>
        )}
        {isError && (
          <Alert_Shadcn_ variant="destructive">
            <WarningIcon />
            <AlertTitle_Shadcn_>Failed to retrieve auth configuration</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>{authConfigError.message}</AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        )}
        {isSuccess && (
          <ResourceList>
            {PROVIDERS_SCHEMAS.map((provider) => {
              const isSAMLEnabled = provider.title === 'SAML 2.0' && authConfig?.SAML_ENABLED
              const isLinkedInOIDCEnabled =
                provider.title === 'LinkedIn (OIDC)' && authConfig?.EXTERNAL_LINKEDIN_OIDC_ENABLED
              const isSlackOIDCEnabled =
                provider.title === 'Slack (OIDC)' && authConfig?.EXTERNAL_SLACK_OIDC_ENABLED
              const isExternalProviderAndEnabled =
                authConfig &&
                (authConfig as any)[`EXTERNAL_${provider?.title?.toUpperCase()}_ENABLED`]

              const isActive =
                isSAMLEnabled ||
                isExternalProviderAndEnabled ||
                isLinkedInOIDCEnabled ||
                isSlackOIDCEnabled

              return (
                <ResourceItem
                  key={`provider_${provider.title}`}
                  media={
                    <img
                      src={`${BASE_PATH}/img/icons/${provider.misc.iconKey}.svg`}
                      width={18}
                      alt={`${provider.title} auth icon`}
                    />
                  }
                  meta={
                    <Badge variant={isActive ? 'success' : 'default'}>
                      {isActive ? 'Enabled' : 'Disabled'}
                    </Badge>
                  }
                  onClick={() => setSelectedProvider(provider.title)}
                >
                  <div>
                    <div className="text-foreground">{provider.title}</div>
                    {'helper' in provider.misc && (
                      <p className="text-foreground-light text-xs">{provider.misc.helper}</p>
                    )}
                  </div>
                </ResourceItem>
              )
            })}
          </ResourceList>
        )}
      </div>

      <Sheet
        open={selectedProvider !== null}
        onOpenChange={(open) => !open && setSelectedProvider(null)}
      >
        <SheetContent size="lg" className="flex flex-col">
          {activeProviderSchema && (
            <Form_Shadcn_ {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col">
                <SheetHeader className="shrink-0">
                  <SheetTitle className="flex items-center gap-3">
                    <img
                      src={`${BASE_PATH}/img/icons/${activeProviderSchema.misc.iconKey}.svg`}
                      width={21}
                      alt={`${activeProviderSchema.title} auth icon`}
                    />
                    {activeProviderSchema.title} Configuration
                  </SheetTitle>
                </SheetHeader>
                <div className="px-6 py-4 flex-grow space-y-4 flex-1 overflow-auto">
                  <ProviderForm
                    config={authConfig}
                    provider={activeProviderSchema as any}
                    onClose={() => setSelectedProvider(null)}
                    form={form}
                  />
                </div>
                <SheetFooter className="border-t px-6 py-4 shrink-0">
                  <div className="flex items-center justify-between w-full">
                    <DocsButton href={activeProviderSchema.link} />
                    <div className="flex items-center gap-x-3">
                      <Button
                        type="default"
                        onClick={() => {
                          form.reset()
                          setSelectedProvider(null)
                        }}
                        disabled={isUpdatingConfig}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={isUpdatingConfig}
                        disabled={isUpdatingConfig}
                      >
                        Save changes
                      </Button>
                    </div>
                  </div>
                </SheetFooter>
              </form>
            </Form_Shadcn_>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default AuthProvidersForm
