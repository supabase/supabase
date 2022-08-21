import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { number, object, string } from 'yup'
import { Alert, Button, Form, Input, InputNumber, Toggle, IconEye, IconEyeOff } from '@supabase/ui'

import {
  FormActions,
  FormHeader,
  FormPanel,
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from 'components/ui/Forms'
import { useStore } from 'hooks'
import { domainRegex } from './../Auth.constants'
import { defaultDisabledSmtpFormValues } from './SmtpForm.constants'
import { generateFormValues, isSmtpEnabled } from './SmtpForm.utils'

const SmtpForm = () => {
  const { authConfig, ui } = useStore()
  const { config, isLoaded } = authConfig

  const [enableSmtp, setEnableSmtp] = useState(false)
  const [hidden, setHidden] = useState(true)

  const formId = 'auth-config-smtp-form'
  const initialValues = generateFormValues(authConfig.config)

  useEffect(() => {
    if (isLoaded && isSmtpEnabled(config)) {
      setEnableSmtp(true)
    }
  }, [isLoaded])

  const schema = object({
    SMTP_ADMIN_EMAIL: string().when([], {
      is: () => {
        return enableSmtp
      },
      then: (schema) => schema.email('Must be a valid email').required('Sender email is required'),
      otherwise: (schema) => schema,
    }),
    SMTP_SENDER_NAME: string().when([], {
      is: () => {
        return enableSmtp
      },
      then: (schema) => schema.required('Sender name is required'),
      otherwise: (schema) => schema,
    }),
    SMTP_HOST: string().when([], {
      is: () => {
        return enableSmtp
      },
      then: (schema) =>
        schema
          .matches(domainRegex, 'Must be a valid URL or IP address')
          .required('Host URL is required.'),
      otherwise: (schema) => schema,
    }),
    SMTP_PORT: number().when([], {
      is: () => {
        return enableSmtp
      },
      then: (schema) =>
        schema
          .required('Port number is required.')
          .min(1, 'Must be a valid port number more than 0')
          .max(65535, 'Must be a valid port number no more than 65535'),
      otherwise: (schema) => schema,
    }),
    SMTP_MAX_FREQUENCY: number().when([], {
      is: () => {
        return enableSmtp
      },
      then: (schema) =>
        schema
          .required('Rate limit is required.')
          .min(1, 'Must be more than 0')
          .max(32767, 'Must not be more than 32,767 an hour'),
      otherwise: (schema) => schema,
    }),
    SMTP_USER: string().when([], {
      is: () => {
        return enableSmtp
      },
      then: (schema) => schema.required('SMTP Username is required'),
      otherwise: (schema) => schema,
    }),
    SMTP_PASS: string().when([], {
      is: () => {
        return enableSmtp
      },
      then: (schema) => schema.required('SMTP password is required'),
      otherwise: (schema) => schema,
    }),
  })

  const onSubmit = async (values: any, { setSubmitting, resetForm }: any) => {
    const payload = enableSmtp ? values : defaultDisabledSmtpFormValues

    // Format payload: Remove redundant value + convert port to string
    delete payload.ENABLE_SMTP
    payload.SMTP_PORT = payload.SMTP_PORT ? payload.SMTP_PORT.toString() : payload.SMTP_PORT

    setSubmitting(true)
    const { error } = await authConfig.update(payload)

    if (!error) {
      setHidden(true)
      const updatedFormValues = generateFormValues(payload)
      resetForm({ values: updatedFormValues, initialValues: updatedFormValues })
      ui.setNotification({ category: 'success', message: 'Successfully updated settings' })
    } else {
      ui.setNotification({ category: 'error', message: 'Failed to update settings', error })
    }

    setSubmitting(false)
  }

  return (
    <Form id={formId} initialValues={initialValues} onSubmit={onSubmit} validationSchema={schema}>
      {({ isSubmitting, resetForm, values }: any) => {
        const isValidSmtpConfig = isSmtpEnabled(values)
        const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

        useEffect(() => {
          if (isLoaded) {
            const formValues = generateFormValues(config)
            resetForm({ values: formValues, initialValues: formValues })
          }
        }, [isLoaded])

        const onResetForm = () => {
          setEnableSmtp(isSmtpEnabled(initialValues))
          resetForm({ values: initialValues })
        }

        return (
          <>
            <FormHeader
              title="SMTP Settings"
              description="You can use your own SMTP server instead of the built-in email service."
            />
            <FormPanel
              footer={
                <div className="flex justify-between py-4 px-8">
                  <FormActions
                    form={formId}
                    isSubmitting={isSubmitting}
                    hasChanges={hasChanges}
                    handleReset={onResetForm}
                  />
                </div>
              }
            >
              <FormSection>
                <FormSectionContent loading={!isLoaded}>
                  <Toggle
                    name="ENABLE_SMTP"
                    size="small"
                    label="Enable Custom SMTP"
                    layout="flex"
                    checked={enableSmtp}
                    // @ts-ignore
                    onChange={(value: boolean) => setEnableSmtp(value)}
                    descriptionText="Emails will be sent using your custom SMTP provider"
                  />
                </FormSectionContent>
              </FormSection>

              {enableSmtp && !isValidSmtpConfig && (
                <div className="mx-8 mb-8 -mt-4">
                  <Alert withIcon variant="warning" title="All fields below must be filled">
                    The following fields must be filled before custom SMTP can be properly enabled
                  </Alert>
                </div>
              )}

              <FormSection
                visible={enableSmtp}
                header={<FormSectionLabel>Sender details</FormSectionLabel>}
                disabled={!enableSmtp}
              >
                <FormSectionContent loading={!isLoaded}>
                  <Input
                    name="SMTP_ADMIN_EMAIL"
                    id="SMTP_ADMIN_EMAIL"
                    label="Sender email"
                    descriptionText="This is the email address the emails are sent from"
                    placeholder="noreply@yourdomain.com"
                  />
                  <Input
                    name="SMTP_SENDER_NAME"
                    id="SMTP_SENDER_NAME"
                    label="Sender name"
                    descriptionText="Name displayed in the recipient's inbox"
                    placeholder="The name shown on the email"
                  />
                </FormSectionContent>
              </FormSection>

              <FormSection
                visible={enableSmtp}
                disabled={!enableSmtp}
                header={
                  <FormSectionLabel>
                    <span>SMTP Provider Settings</span>
                    <p className="text-scale-900 my-4">
                      Your SMTP Credentials will always be encrypted in our database.
                    </p>
                  </FormSectionLabel>
                }
              >
                <FormSectionContent loading={!isLoaded}>
                  <Input
                    name="SMTP_HOST"
                    placeholder="your.smtp.host.com"
                    id="SMTP_HOST"
                    label="Host"
                    descriptionText="Hostname or IP address of your SMTP server."
                  />
                  <InputNumber
                    name="SMTP_PORT"
                    id="SMTP_PORT"
                    placeholder="587"
                    label="Port number"
                    descriptionText={
                      <>
                        <span className="block">
                          Port used by your SMTP server. Common ports include 25, 465, and 587.{' '}
                        </span>
                        <span className="mt-2 block">
                          Avoid using port 25 as modern SMTP email clients shouldn't use this port,
                          it is traditionally blocked by residential ISPs and Cloud Hosting
                          Providers, to curb the amount of spam.
                        </span>
                      </>
                    }
                  />
                  <InputNumber
                    id="SMTP_MAX_FREQUENCY"
                    name="SMTP_MAX_FREQUENCY"
                    label="Minimum interval between emails being sent"
                    descriptionText="How long between each email can a new email be sent via your SMTP server."
                    actions={<span className="text-scale-900 mr-3">seconds</span>}
                  />
                  <InputNumber
                    name="RATE_LIMIT_EMAIL_SENT"
                    id="RATE_LIMIT_EMAIL_SENT"
                    min={0}
                    label="Rate limit for sending emails"
                    descriptionText="How many emails can be sent per hour."
                    actions={<span className="text-scale-900 mr-3">emails per hour</span>}
                  />
                  <Input
                    name="SMTP_USER"
                    id="SMTP_USER"
                    label="Username"
                    placeholder="SMTP Username"
                  />
                  <Input
                    name="SMTP_PASS"
                    id="SMTP_PASS"
                    type={hidden ? 'password' : 'text'}
                    label="Password"
                    placeholder="SMTP Password"
                    actions={
                      <Button
                        icon={hidden ? <IconEye /> : <IconEyeOff />}
                        type="default"
                        onClick={() => setHidden(!hidden)}
                      />
                    }
                  />
                </FormSectionContent>
              </FormSection>
            </FormPanel>
          </>
        )
      }}
    </Form>
  )
}

export default observer(SmtpForm)
