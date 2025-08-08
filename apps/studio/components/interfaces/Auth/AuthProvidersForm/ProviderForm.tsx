import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'

import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DocsButton } from 'components/ui/DocsButton'
import { ResourceItem } from 'components/ui/Resource/ResourceItem'
import type { components } from 'data/api'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { BASE_PATH } from 'lib/constants'
import { useQueryState } from 'nuqs'
import { Button, Form, Input, Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from 'ui'
import { Admonition } from 'ui-patterns'
import { NO_REQUIRED_CHARACTERS } from '../Auth.constants'
import { AuthAlert } from './AuthAlert'
import type { Provider } from './AuthProvidersForm.types'
import FormField from './FormField'

export interface ProviderFormProps {
  config: components['schemas']['GoTrueConfigResponse']
  provider: Provider
  isActive: boolean
}

export const ProviderForm = ({ config, provider, isActive }: ProviderFormProps) => {
  const { ref: projectRef } = useParams()
  const [urlProvider, setUrlProvider] = useQueryState('provider', { defaultValue: '' })

  const [open, setOpen] = useState(false)
  const { mutate: updateAuthConfig, isLoading: isUpdatingConfig } = useAuthConfigUpdateMutation()

  const doubleNegativeKeys = ['SMS_AUTOCONFIRM']
  const canUpdateConfig: boolean = useCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  const shouldDisableField = (field: string): boolean => {
    const shouldDisableSmsFields =
      config.HOOK_SEND_SMS_ENABLED &&
      field.startsWith('SMS_') &&
      ![
        'SMS_AUTOCONFIRM',
        'SMS_OTP_EXP',
        'SMS_OTP_LENGTH',
        'SMS_OTP_LENGTH',
        'SMS_TEMPLATE',
        'SMS_TEST_OTP',
        'SMS_TEST_OTP_VALID_UNTIL',
      ].includes(field)
    return (
      ['EXTERNAL_SLACK_CLIENT_ID', 'EXTERNAL_SLACK_SECRET'].includes(field) ||
      shouldDisableSmsFields
    )
  }

  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.endpoint
  const apiUrl = `${protocol}://${endpoint}`

  const { data: customDomainData } = useCustomDomainsQuery({ projectRef })

  const INITIAL_VALUES = (() => {
    const initialValues: { [x: string]: string | boolean } = {}
    Object.keys(provider.properties).forEach((key) => {
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
  })()

  const onSubmit = (values: any, { resetForm }: any) => {
    const payload = { ...values }
    Object.keys(values).map((x: string) => {
      if (doubleNegativeKeys.includes(x)) payload[x] = !values[x]
      if (payload[x] === '') payload[x] = null
    })

    // The backend uses empty string to represent no required characters in the password
    if (payload.PASSWORD_REQUIRED_CHARACTERS === NO_REQUIRED_CHARACTERS) {
      payload.PASSWORD_REQUIRED_CHARACTERS = ''
    }

    updateAuthConfig(
      { projectRef: projectRef!, config: payload },
      {
        onSuccess: () => {
          resetForm({ values: { ...values }, initialValues: { ...values } })
          setOpen(false)
          setUrlProvider(null)
          toast.success('Successfully updated settings')
        },
      }
    )
  }

  // Handle clicking on a provider in the list
  const handleProviderClick = () => setUrlProvider(provider.title)

  const handleOpenChange = (isOpen: boolean) => {
    // Remove provider query param from URL when closed
    if (!isOpen) setUrlProvider(null)
  }

  // Open or close the form based on the query parameter
  useEffect(() => {
    const isProviderInQuery = urlProvider.toLowerCase() === provider.title.toLowerCase()
    setOpen(isProviderInQuery)
  }, [urlProvider, provider.title])

  return (
    <>
      <ResourceItem
        onClick={handleProviderClick}
        media={
          <img
            src={`${BASE_PATH}/img/icons/${provider.misc.iconKey}.svg`}
            width={18}
            height={18}
            alt={`${provider.title} auth icon`}
          />
        }
        meta={
          isActive ? (
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
          )
        }
      >
        {provider.title}
      </ResourceItem>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className="flex flex-col gap-0">
          <SheetHeader className="shrink-0 flex items-center gap-4">
            <img
              src={`${BASE_PATH}/img/icons/${provider.misc.iconKey}.svg`}
              width={18}
              height={18}
              alt={`${provider.title} auth icon`}
            />
            <SheetTitle>{provider.title}</SheetTitle>
          </SheetHeader>
          <Form
            id={`provider-${provider.title}-form`}
            name={`provider-${provider.title}-form`}
            initialValues={INITIAL_VALUES}
            validationSchema={provider.validationSchema}
            onSubmit={onSubmit}
            className="flex-1 overflow-hidden flex flex-col"
          >
            {({ handleReset, initialValues, values, setFieldValue }: any) => {
              const noChanges = JSON.stringify(initialValues) === JSON.stringify(values)
              return (
                <>
                  <div className="flex-1 overflow-y-auto group py-6 px-4 md:px-6 text-foreground">
                    <div className="mx-auto max-w-lg space-y-6">
                      <AuthAlert
                        title={provider.title}
                        isHookSendSMSEnabled={config.HOOK_SEND_SMS_ENABLED}
                      />
                      {Object.keys(provider.properties).map((x: string) => (
                        <FormField
                          key={x}
                          name={x}
                          setFieldValue={setFieldValue}
                          properties={provider.properties[x]}
                          formValues={values}
                          disabled={shouldDisableField(x) || !canUpdateConfig}
                        />
                      ))}

                      {provider?.misc?.alert && (
                        <Admonition
                          type="warning"
                          title={provider.misc.alert.title}
                          description={
                            <>
                              <ReactMarkdown>{provider.misc.alert.description}</ReactMarkdown>
                            </>
                          }
                        />
                      )}

                      {provider.misc.requiresRedirect && (
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
                            <Markdown
                              content={provider.misc.helper}
                              className="text-foreground-lighter"
                            />
                          }
                        />
                      )}
                    </div>
                  </div>
                  <SheetFooter className="shrink-0">
                    <div className="flex items-center justify-between w-full">
                      <DocsButton href={provider.link} />
                      <div className="flex items-center gap-x-3">
                        <Button
                          type="default"
                          htmlType="reset"
                          onClick={() => {
                            handleReset()
                            setOpen(false)
                            setUrlProvider(null)
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
                  </SheetFooter>
                </>
              )
            }}
          </Form>
        </SheetContent>
      </Sheet>
    </>
  )
}
