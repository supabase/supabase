import { yupResolver } from '@hookform/resolvers/yup'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { Check } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useQueryState } from 'nuqs'
import { useEffect, useId, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { NO_REQUIRED_CHARACTERS } from '../Auth.constants'
import { AuthAlert } from './AuthAlert'
import type { Provider } from './AuthProvidersForm.types'
import FormField from './FormField'
import { Markdown } from '@/components/interfaces/Markdown'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { DocsButton } from '@/components/ui/DocsButton'
import { ResourceItem } from '@/components/ui/Resource/ResourceItem'
import type { components } from '@/data/api'
import { useAuthConfigUpdateMutation } from '@/data/auth/auth-config-update-mutation'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { useHasEntitlementAccess } from '@/hooks/misc/useCheckEntitlements'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useStaticEffectEvent } from '@/hooks/useStaticEffectEvent'
import { BASE_PATH } from '@/lib/constants'

interface ProviderFormProps {
  config: components['schemas']['GoTrueConfigResponse']
  provider: Provider
  isActive: boolean
}

const doubleNegativeKeys = ['SMS_AUTOCONFIRM']

export const ProviderForm = ({ config, provider, isActive }: ProviderFormProps) => {
  const { resolvedTheme } = useTheme()
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()
  const [urlProvider, setUrlProvider] = useQueryState('provider', { defaultValue: '' })

  const [open, setOpen] = useState(false)
  const { mutate: updateAuthConfig, isPending: isUpdatingConfig } = useAuthConfigUpdateMutation()

  const { data: endpoint } = useProjectApiUrl({ projectRef })

  const { can: canUpdateConfig } = useAsyncCheckPermissions(
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

  const hasEntitlementAccess = useHasEntitlementAccess()

  const getValuesForProvider = useStaticEffectEvent(
    (config: components['schemas']['GoTrueConfigResponse']) => {
      const values: { [x: string]: string | boolean } = {}
      Object.keys(provider.properties).forEach((key) => {
        const isDoubleNegative = doubleNegativeKeys.includes(key)
        if (provider.title === 'SAML 2.0') {
          const configValue = (config as any)[key]
          values[key] = configValue || (provider.properties[key].type === 'boolean' ? false : '')
        } else {
          if (isDoubleNegative) {
            values[key] = !(config as any)[key]
          } else {
            const configValue = (config as any)[key]
            values[key] = configValue
              ? configValue
              : provider.properties[key].type === 'boolean'
                ? false
                : ''
          }
        }
      })
      return values
    }
  )

  const INITIAL_VALUES = useMemo(() => {
    return getValuesForProvider(config)
  }, [config, getValuesForProvider])

  const onSubmit = (values: any) => {
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
        onSuccess: (newValues) => {
          setOpen(false)
          setUrlProvider(null)
          form.reset(getValuesForProvider(newValues))
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

  const form = useForm({
    defaultValues: INITIAL_VALUES,
    resolver: yupResolver(provider.validationSchema),
    shouldUnregister: true,
  })

  useEffect(() => {
    if (open) {
      form.reset(INITIAL_VALUES)
    }
  }, [open, form, INITIAL_VALUES])
  const formId = useId()

  return (
    <>
      <ResourceItem
        onClick={handleProviderClick}
        media={
          <img
            src={`${BASE_PATH}/img/icons/${provider.misc.iconKey}${provider.misc.hasLightIcon && !resolvedTheme?.includes('dark') ? '-light' : ''}.svg`}
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
        <SheetContent className="flex flex-col gap-0" size="lg">
          <SheetHeader className="shrink-0 flex items-center gap-4">
            <img
              src={`${BASE_PATH}/img/icons/${provider.misc.iconKey}${provider.misc.hasLightIcon && !resolvedTheme?.includes('dark') ? '-light' : ''}.svg`}
              width={18}
              height={18}
              alt={`${provider.title} auth icon`}
            />
            <SheetTitle>{provider.title}</SheetTitle>
          </SheetHeader>
          <Form_Shadcn_ {...form}>
            <form
              id={formId}
              name={formId}
              className="overflow-y-auto flex-grow px-0"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <AuthAlert
                title={provider.title}
                isHookSendSMSEnabled={config.HOOK_SEND_SMS_ENABLED}
              />

              {Object.keys(provider.properties).map((x: string) => {
                const { entitlementKey } = provider.properties[x]
                const hasAccess = entitlementKey == null || hasEntitlementAccess(entitlementKey)

                return (
                  <FormField
                    key={x}
                    projectRef={projectRef}
                    organizationSlug={organization?.slug}
                    name={x}
                    properties={provider.properties[x]}
                    control={form.control}
                    disabled={shouldDisableField(x) || !canUpdateConfig}
                    hasAccess={hasAccess}
                  />
                )
              })}

              {provider?.misc?.alert && (
                <SheetSection>
                  <Admonition
                    type="warning"
                    title={provider.misc.alert.title}
                    description={<ReactMarkdown>{provider.misc.alert.description}</ReactMarkdown>}
                  />
                </SheetSection>
              )}

              {provider.misc.requiresRedirect && (
                <SheetSection>
                  <FormItemLayout
                    layout="horizontal"
                    label="Callback URL (for OAuth)"
                    description={
                      <Markdown
                        content={provider.misc.helper}
                        className="text-foreground-lighter"
                      />
                    }
                  >
                    <Input copy readOnly value={endpoint ? `${endpoint}/auth/v1/callback` : ''} />
                  </FormItemLayout>
                </SheetSection>
              )}
            </form>
          </Form_Shadcn_>
          <SheetFooter className="shrink-0">
            <div className="flex items-center justify-between w-full">
              <DocsButton href={provider.link} />
              <div className="flex items-center gap-x-3">
                <Button
                  type="default"
                  htmlType="reset"
                  onClick={() => {
                    setOpen(false)
                    setUrlProvider(null)
                    form.reset()
                  }}
                  disabled={isUpdatingConfig}
                >
                  Cancel
                </Button>
                <ButtonTooltip
                  form={formId}
                  htmlType="submit"
                  loading={isUpdatingConfig}
                  disabled={isUpdatingConfig || !canUpdateConfig || !form.formState.isDirty}
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
        </SheetContent>
      </Sheet>
    </>
  )
}
