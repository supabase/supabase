import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { Check, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import type { components } from 'data/api'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { BASE_PATH } from 'lib/constants'
import {
  Alert,
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  Collapsible,
  Form,
  Input,
  WarningIcon,
} from 'ui'
import { ProviderCollapsibleClasses } from './AuthProvidersForm.constants'
import type { Provider } from './AuthProvidersForm.types'
import FormField from './FormField'

export interface ProviderFormProps {
  config: components['schemas']['GoTrueConfigResponse']
  provider: Provider
}

const ProviderForm = ({ config, provider }: ProviderFormProps) => {
  const [open, setOpen] = useState(false)
  const { ref: projectRef } = useParams()
  const { mutate: updateAuthConfig, isLoading: isUpdatingConfig } = useAuthConfigUpdateMutation()

  const doubleNegativeKeys = ['MAILER_AUTOCONFIRM', 'SMS_AUTOCONFIRM']
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  const { data: settings } = useProjectApiQuery({ projectRef })
  const apiUrl = `${settings?.autoApiService.protocol}://${settings?.autoApiService.endpoint}`

  const { data: customDomainData } = useCustomDomainsQuery({ projectRef })

  const generateInitialValues = () => {
    const initialValues: { [x: string]: string | boolean } = {}

    // the config is already loaded through the parent component
    Object.keys(provider.properties).forEach((key) => {
      // When the key is a 'double negative' key, we must reverse the boolean before adding it to the form
      const isDoubleNegative = doubleNegativeKeys.includes(key)

      if (provider.title === 'SAML 2.0') {
        const configValue = (config as any)[key]
        initialValues[key] =
          configValue || (provider.properties[key].type === 'boolean' ? false : '')
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

  const isSAMLEnabled: boolean =
    provider.title === 'SAML 2.0' && config && (config as any)['SAML_ENABLED']
  // [Joel] Introduced as the new LinkedIn provider has a corresponding config var of LINKEDIN_OIDC
  const isLinkedInOIDCEnabled: boolean =
    provider.title === 'LinkedIn (OIDC)' &&
    config &&
    (config as any)['EXTERNAL_LINKEDIN_OIDC_ENABLED']
  const isSlackOIDCEnabled =
    provider.title === 'Slack (OIDC)' && config['EXTERNAL_SLACK_OIDC_ENABLED']
  const isExternalProviderAndEnabled: boolean =
    config && (config as any)[`EXTERNAL_${provider?.title?.toUpperCase()}_ENABLED`]

  // [Joshen] Doing this check as SAML doesn't follow the same naming structure as the other provider options
  const isActive: boolean =
    isSAMLEnabled || isExternalProviderAndEnabled || isLinkedInOIDCEnabled || isSlackOIDCEnabled
  const INITIAL_VALUES = generateInitialValues()

  const onSubmit = (values: any, { resetForm }: any) => {
    const payload = { ...values }

    // Format payload for the following checks:
    // 1. Convert all empty string values to null
    // 2. When the key is a 'double negative' key, we must reverse the boolean before the payload can be sent
    Object.keys(values).map((x: string) => {
      if (doubleNegativeKeys.includes(x)) payload[x] = !values[x]
      if (payload[x] === '') payload[x] = null
    })

    updateAuthConfig(
      { projectRef: projectRef!, config: payload },
      {
        onSuccess: () => {
          resetForm({ values: { ...values }, initialValues: { ...values } })
          setOpen(false)
          toast.success('Successfully updated settings')
        },
      }
    )
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={ProviderCollapsibleClasses.join(' ')}
    >
      <Collapsible.Trigger asChild>
        <button
          type="button"
          className="group flex w-full items-center justify-between rounded py-3 px-6 text-foreground"
        >
          <div className="flex items-center gap-3">
            <ChevronUp
              className="text-border-stronger transition data-open-parent:rotate-0 data-closed-parent:rotate-180"
              strokeWidth={2}
              width={14}
            />
            <img
              src={`${BASE_PATH}/img/icons/${provider.misc.iconKey}.svg`}
              width={18}
              alt={`${provider.title} auth icon`}
            />
            <span className="text-sm">{provider.title}</span>
          </div>
          <div className="flex items-center gap-3">
            {isActive ? (
              <div className="flex items-center gap-1 rounded-full border border-brand-400 bg-brand-200 py-1 px-1 text-xs text-brand">
                <span className="rounded-full bg-brand p-0.5 text-xs text-brand-200">
                  <Check strokeWidth={2} size={12} />
                </span>
                <span className="px-1">Enabled</span>
              </div>
            ) : (
              <div className="rounded-md border border-strong bg-surface-100 py-1 px-3 text-xs text-foreground-lighter">
                Disabled
              </div>
            )}
          </div>
        </button>
      </Collapsible.Trigger>
      <Form
        name={`provider-${provider.title}-form`}
        initialValues={INITIAL_VALUES}
        validationSchema={provider.validationSchema}
        onSubmit={onSubmit}
      >
        {({ handleReset, initialValues, values }: any) => {
          const noChanges = JSON.stringify(initialValues) === JSON.stringify(values)
          return (
            <Collapsible.Content>
              <div className="group border-t border-strong bg-surface-100 py-6 px-6 text-foreground">
                {provider.title === 'Slack (Deprecated)' && (
                  <Alert_Shadcn_ variant="warning">
                    <WarningIcon />
                    <AlertTitle_Shadcn_>Slack (Deprecated) Provider</AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_>
                      Recently, Slack has updated their OAuth API. Please use the new Slack (OIDC)
                      provider below. Developers using this provider should move over to the new
                      provider. Please refer to our{' '}
                      <a
                        href="https://supabase.com/docs/guides/auth/social-login/auth-slack"
                        className="underline"
                        target="_blank"
                      >
                        documentation
                      </a>{' '}
                      for more details.
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                )}
                <div className="mx-auto my-6 max-w-lg space-y-6">
                  {Object.keys(provider.properties).map((x: string) => (
                    <FormField
                      key={x}
                      name={x}
                      properties={provider.properties[x]}
                      formValues={values}
                      disabled={
                        // TODO (KM): Remove after 10th October 2024 when we disable the provider
                        ['EXTERNAL_SLACK_CLIENT_ID', 'EXTERNAL_SLACK_SECRET'].includes(x) ||
                        !canUpdateConfig
                      }
                    />
                  ))}

                  {provider?.misc?.alert && (
                    <Alert title={provider.misc.alert.title} variant="warning" withIcon>
                      <ReactMarkdown>{provider.misc.alert.description}</ReactMarkdown>
                    </Alert>
                  )}

                  {provider.misc.requiresRedirect && (
                    <>
                      <Input
                        copy
                        readOnly
                        disabled
                        label="Callback URL (for OAuth)"
                        value={
                          customDomainData?.customDomain?.status === 'active'
                            ? `https://${customDomainData.customDomain?.hostname}/auth/v1/callback`
                            : `${apiUrl}/auth/v1/callback`
                        }
                        descriptionText={
                          <ReactMarkdown unwrapDisallowed disallowedElements={['p']}>
                            {provider.misc.helper}
                          </ReactMarkdown>
                        }
                      />
                    </>
                  )}
                  <div className="flex items-center justify-end gap-3">
                    <Button
                      type="default"
                      htmlType="reset"
                      onClick={() => {
                        handleReset()
                        setOpen(false)
                      }}
                      disabled={isUpdatingConfig}
                    >
                      Cancel
                    </Button>
                    <ButtonTooltip
                      htmlType="submit"
                      loading={isUpdatingConfig}
                      disabled={isUpdatingConfig || !canUpdateConfig || noChanges}
                      tooltip={{
                        content: {
                          side: 'bottom',
                          text: !canUpdateConfig
                            ? 'You need additional permissions to update provider settings'
                            : undefined,
                        },
                      }}
                    >
                      Save
                    </ButtonTooltip>
                  </div>
                </div>
              </div>
            </Collapsible.Content>
          )
        }}
      </Form>
    </Collapsible>
  )
}

export default ProviderForm
