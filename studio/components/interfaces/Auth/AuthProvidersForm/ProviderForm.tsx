import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Alert, Button, Collapsible, Form, IconCheck, IconChevronUp, Input } from 'ui'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { useCheckPermissions, useStore } from 'hooks'
import { BASE_PATH } from 'lib/constants'
import { ProviderCollapsibleClasses } from './AuthProvidersForm.constants'
import { Provider } from './AuthProvidersForm.types'
import FormField from './FormField'

export interface ProviderFormProps {
  provider: Provider
}

const ProviderForm = ({ provider }: ProviderFormProps) => {
  const [open, setOpen] = useState(false)
  const { authConfig, ui } = useStore()
  const { project: selectedProject } = useProjectContext()
  const { ref } = useParams()
  const doubleNegativeKeys = ['MAILER_AUTOCONFIRM', 'SMS_AUTOCONFIRM']
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  const { data: customDomainData } = useCustomDomainsQuery({ projectRef: ref })

  const generateInitialValues = () => {
    const initialValues: { [x: string]: string } = {}
    Object.keys(provider.properties).forEach((key) => {
      // When the key is a 'double negative' key, we must reverse the boolean before adding it to the form
      const isDoubleNegative = doubleNegativeKeys.includes(key)

      if (provider.title === 'SAML 2.0') {
        initialValues[key] = authConfig.config[key] ?? false
      } else {
        initialValues[key] = isDoubleNegative
          ? !authConfig.config[key]
          : authConfig.config[key] ?? ''
      }
    })
    return initialValues
  }

  // [Joshen] Doing this check as SAML doesn't follow the same naming structure as the other provider options
  const isActive =
    provider.title === 'SAML 2.0'
      ? authConfig.config['SAML_ENABLED'] || false
      : authConfig.config[`EXTERNAL_${provider?.title?.toUpperCase()}_ENABLED`]
  const INITIAL_VALUES = generateInitialValues()

  const onSubmit = async (values: any, { setSubmitting, resetForm }: any) => {
    const payload = { ...values }

    // When the key is a 'double negative' key, we must reverse the boolean before the payload can be sent
    Object.keys(values).map((x: string) => {
      if (doubleNegativeKeys.includes(x)) {
        payload[x] = !values[x]
      }
    })

    const { error } = await authConfig.update(payload)

    if (!error) {
      resetForm({ values: { ...values }, initialValues: { ...values } })
      setOpen(false)
      ui.setNotification({ category: 'success', message: 'Successfully updated settings' })
    } else {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to update settings:  ${error?.message}`,
      })
    }

    setSubmitting(false)
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
          className="group flex w-full items-center justify-between rounded py-3 px-6 text-scale-1200"
        >
          <div className="flex items-center gap-3">
            <IconChevronUp
              className="text-scale-800 transition data-open-parent:rotate-0 data-closed-parent:rotate-180"
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
              <div className="flex items-center gap-1 rounded-full border border-brand-700 bg-brand-200 py-1 px-1 text-xs text-brand-900">
                <span className="rounded-full bg-brand-900 p-0.5 text-xs text-brand-200">
                  <IconCheck strokeWidth={2} size={12} />
                </span>
                <span className="px-1">Enabled</span>
              </div>
            ) : (
              <div className="rounded-md border border-scale-500 bg-scale-100 py-1 px-3 text-xs text-scale-900 dark:border-scale-700 dark:bg-scale-300">
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
        {({ isSubmitting, handleReset, initialValues, values }: any) => {
          const noChanges = JSON.stringify(initialValues) === JSON.stringify(values)
          return (
            <Collapsible.Content>
              <div
                className="
                  group border-t
                  border-scale-500 bg-scale-100 py-6 px-6 text-scale-1200 dark:bg-scale-300
                "
              >
                <div className="mx-auto my-6 max-w-lg space-y-6">
                  {Object.keys(provider.properties).map((x: string) => (
                    <FormField
                      key={x}
                      name={x}
                      properties={provider.properties[x]}
                      formValues={values}
                      disabled={!canUpdateConfig}
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
                            : `https://${selectedProject?.ref}.supabase.co/auth/v1/callback`
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
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Tooltip.Root delayDuration={0}>
                      <Tooltip.Trigger type="button">
                        <Button
                          htmlType="submit"
                          loading={isSubmitting}
                          disabled={isSubmitting || !canUpdateConfig || noChanges}
                        >
                          Save
                        </Button>
                      </Tooltip.Trigger>
                      {!canUpdateConfig && (
                        <Tooltip.Portal>
                          <Tooltip.Content side="bottom">
                            <Tooltip.Arrow className="radix-tooltip-arrow" />
                            <div
                              className={[
                                'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                                'border border-scale-200',
                              ].join(' ')}
                            >
                              <span className="text-xs text-scale-1200">
                                You need additional permissions to update provider settings
                              </span>
                            </div>
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      )}
                    </Tooltip.Root>
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
