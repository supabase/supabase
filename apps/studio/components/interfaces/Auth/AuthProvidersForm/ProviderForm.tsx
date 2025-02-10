import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Check, ChevronUp, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import { useForm, useWatch } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DocsButton } from 'components/ui/DocsButton'
import { FormFieldWrapper } from 'components/ui/Forms'
import type { components } from 'data/api'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { BASE_PATH } from 'lib/constants'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  Form_Shadcn_,
  Input_Shadcn_,
  Switch,
  WarningIcon,
  Card,
  CardContent,
  CardFooter,
} from 'ui'
import type { Provider } from './AuthProvidersForm.types'
import { Markdown } from 'components/interfaces/Markdown'
import { Admonition } from 'ui-patterns'
import { EyeIcon } from 'lucide-react'
import FormField from './FormField'

export interface ProviderFormProps {
  config: components['schemas']['GoTrueConfigResponse']
  provider: Provider
  onClose: () => void
  form: any
}

const generateInitialValues = (provider: Provider, config: ProviderFormProps['config']) => {
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

const ProviderForm = ({ config, provider, onClose, form }: ProviderFormProps) => {
  const { ref: projectRef, provider: urlProvider } = useParams()
  const canUpdateConfig: boolean = useCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  const watchedValues = useWatch({
    control: form.control,
    name: Object.keys(provider.properties).map((key) => key),
  })

  const isSAMLEnabled: boolean =
    provider.title === 'SAML 2.0' && config && (config as any)['SAML_ENABLED']
  const isLinkedInOIDCEnabled: boolean =
    provider.title === 'LinkedIn (OIDC)' &&
    config &&
    (config as any)['EXTERNAL_LINKEDIN_OIDC_ENABLED']
  const isSlackOIDCEnabled =
    provider.title === 'Slack (OIDC)' && config['EXTERNAL_SLACK_OIDC_ENABLED']
  const isExternalProviderAndEnabled: boolean =
    config && (config as any)[`EXTERNAL_${provider?.title?.toUpperCase()}_ENABLED`]

  const isActive: boolean =
    isSAMLEnabled || isExternalProviderAndEnabled || isLinkedInOIDCEnabled || isSlackOIDCEnabled

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

  const showAlert = (title: string) => {
    switch (title) {
      // TODO (KM): Remove after 10th October 2024 when we disable the provider
      case 'Slack (Deprecated)':
        return (
          <Alert_Shadcn_ variant="warning">
            <WarningIcon />
            <AlertTitle_Shadcn_>Slack (Deprecated) Provider</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              Recently, Slack has updated their OAuth API. Please use the new Slack (OIDC) provider
              below. Developers using this provider should move over to the new provider. Please
              refer to our{' '}
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
        )
      case 'Phone':
        return (
          config.HOOK_SEND_SMS_ENABLED && (
            <Alert_Shadcn_>
              <WarningIcon />
              <AlertTitle_Shadcn_>
                SMS provider settings are disabled while the SMS hook is enabled.
              </AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_ className="flex flex-col gap-y-3">
                <p>The SMS hook will be used in place of the SMS provider configured</p>
                <Button asChild type="default" className="w-min" icon={<ExternalLink />}>
                  <Link href={`/project/${projectRef}/auth/hooks`}>View auth hooks</Link>
                </Button>
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          )
        )
      default:
        return null
    }
  }

  useEffect(() => {
    if (urlProvider?.toLowerCase() === provider.title.toLowerCase()) {
      onClose()
    }
  }, [urlProvider])

  return (
    <div className="py-4">
      {showAlert(provider.title)}

      <Card>
        <CardContent>
          <div className="flex items-center justify-between space-x-2">
            <div>
              <p className="text-sm text-foreground">Provider Status</p>
              <p className="text-sm text-foreground-light">
                Enable or disable {provider.title} authentication for your users
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-foreground-light">
                {isActive ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </CardContent>

        {Object.keys(provider.properties).map((key) => {
          const property = provider.properties[key]
          if (!property) return null

          // Check if field should be shown based on dependencies
          if (property.show) {
            const watchedValue = watchedValues[Object.keys(provider.properties).indexOf(key)]
            if (property.show.matches) {
              if (!property.show.matches.includes(watchedValue)) {
                return null
              }
            } else if (!watchedValue) {
              return null
            }
          }

          return (
            <CardContent key={key}>
              <FormFieldWrapper
                control={form.control}
                name={key}
                label={property.title || key}
                description={property.description || ''}
                orientation="horizontal"
              >
                {(field) => (
                  <FormField
                    field={field}
                    name={key}
                    properties={property}
                    disabled={shouldDisableField(key) || !canUpdateConfig}
                  />
                )}
              </FormFieldWrapper>
            </CardContent>
          )
        })}

        {provider?.misc?.alert && (
          <CardContent>
            <Admonition
              type="warning"
              title={provider.misc.alert.title}
              description={
                <>
                  <ReactMarkdown>{provider.misc.alert.description}</ReactMarkdown>
                </>
              }
            />
          </CardContent>
        )}

        {provider.misc.requiresRedirect && (
          <CardContent>
            <FormFieldWrapper
              control={form.control}
              name="callback_url"
              label="Callback URL (for OAuth)"
              description={
                <Markdown content={provider.misc.helper} className="text-foreground-lighter" />
              }
              orientation="horizontal"
            >
              {() => (
                <div className="flex gap-4">
                  <Input_Shadcn_
                    readOnly
                    disabled
                    value={
                      customDomainData?.customDomain?.status === 'active'
                        ? `https://${customDomainData.customDomain?.hostname}/auth/v1/callback`
                        : `${apiUrl}/auth/v1/callback`
                    }
                  />
                  <Button
                    type="default"
                    onClick={() => {
                      const url =
                        customDomainData?.customDomain?.status === 'active'
                          ? `https://${customDomainData.customDomain?.hostname}/auth/v1/callback`
                          : `${apiUrl}/auth/v1/callback`
                      navigator.clipboard.writeText(url)
                      toast.success('Copied to clipboard')
                    }}
                  >
                    Copy
                  </Button>
                </div>
              )}
            </FormFieldWrapper>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

export default ProviderForm
