import { FC, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Alert, Button, Collapsible, Form, IconCheck, IconChevronUp, Input } from '@supabase/ui'

import { useStore } from 'hooks'
import { Provider } from './AuthProvidersForm.types'
import { ProviderCollapsibleClasses } from './AuthProvidersForm.constants'
import FormField from './FormField'

interface Props {
  provider: Provider
}

const ProviderForm: FC<Props> = ({ provider }) => {
  const [open, setOpen] = useState(false)
  const { authConfig, ui } = useStore()

  const doubleNegativeKeys = ['MAILER_AUTOCONFIRM', 'SMS_AUTOCONFIRM']

  const generateInitialValues = () => {
    const initialValues: { [x: string]: string } = {}
    Object.keys(provider.properties).forEach((key) => {
      // When the key is a 'double negative' key, we must reverse the boolean before adding it to the form
      const isDoubleNegative = doubleNegativeKeys.includes(key)
      initialValues[key] = isDoubleNegative ? !authConfig.config[key] : authConfig.config[key] ?? ''
    })
    return initialValues
  }

  const isActive = authConfig.config[`EXTERNAL_${provider?.title?.toUpperCase()}_ENABLED`]
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
      resetForm({ values: payload, initialValues: payload })
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
              src={`/img/icons/${provider.misc.iconKey}.svg`}
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
        {({ isSubmitting, handleReset, values }: any) => {
          const noChanges = JSON.stringify(INITIAL_VALUES) === JSON.stringify(values)
          return (
            <Collapsible.Content>
              <div
                className="
                  group border-t
                  border-scale-500 bg-scale-100 py-6 px-6 text-scale-1200 dark:bg-scale-300
                "
              >
                <div className="mx-auto my-6 max-w-md space-y-6">
                  {Object.keys(provider.properties).map((x: string) => (
                    <FormField
                      key={x}
                      name={x}
                      properties={provider.properties[x]}
                      formValues={values}
                    />
                  ))}
                  {provider?.misc?.alert && (
                    <Alert title={provider.misc.alert.title} variant="warning" withIcon>
                      <ReactMarkdown>{provider.misc.alert.description}</ReactMarkdown>
                    </Alert>
                  )}
                  {provider.misc.requiresRedirect && (
                    <>
                      <ReactMarkdown className="text-xs text-scale-900">
                        {provider.misc.helper}
                      </ReactMarkdown>
                      <Input
                        copy
                        readOnly
                        disabled
                        label="Redirect URL"
                        value={`https://${ui.selectedProjectRef}.supabase.co/auth/v1/callback`}
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
                    >
                      Cancel
                    </Button>
                    <Button htmlType="submit" loading={isSubmitting} disabled={noChanges}>
                      Save
                    </Button>
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
