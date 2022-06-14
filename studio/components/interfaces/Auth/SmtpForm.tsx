import { Alert, Form, Input, InputNumber, Loading, Toggle } from '@supabase/ui'
import { useStore } from 'hooks'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import auth from 'pages/project/[ref]/auth'
import React from 'react'
import { useState } from 'react'
import { useEffect } from 'react'
import { boolean, number, object, string } from 'yup'
import {
  FormActions,
  FormHeader,
  FormPanel,
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from '../../ui/Forms'

const SmtpForm = observer(() => {
  const { authConfig, ui } = useStore()
  const [enableSmtp, setEnableSmtp] = useState(false)

  function generateInitialValues(config: any) {
    return {
      ENABLE_SMTP: enableSmtp,
      SMTP_ADMIN_EMAIL: config.SMTP_ADMIN_EMAIL ?? '',
      SMTP_SENDER_NAME: config.SMTP_SENDER_NAME ?? '',
      SMTP_USER: config.SMTP_USER ?? '',
      SMTP_HOST: config.SMTP_HOST ?? '',
      SMTP_PASS: config.SMTP_PASS ?? '',
      SMTP_PORT: config.SMTP_PORT ?? 465,
      SMTP_MAX_FREQUENCY: config.SMTP_MAX_FREQUENCY ?? undefined,
    }
  }

  // const INITIAL_VALUES = generateInitialValues(authConfig.config)

  function checkSmtpState(config: any, resetForm: () => void) {
    console.log(
      config.SMTP_ADMIN_EMAIL,
      config.SMTP_SENDER_NAME,
      config.SMTP_USER,
      config.SMTP_HOST,
      config.SMTP_PASS,
      config.SMTP_PORT,
      config.SMTP_MAX_FREQUENCY
    )
    if (
      config.SMTP_ADMIN_EMAIL &&
      config.SMTP_SENDER_NAME &&
      config.SMTP_USER &&
      config.SMTP_HOST &&
      config.SMTP_PASS &&
      config.SMTP_PORT &&
      config.SMTP_MAX_FREQUENCY > 0
    ) {
      console.log('TRUE')
      setEnableSmtp(true)
      resetForm()
    } else {
      console.log('FALSE')
      setEnableSmtp(false)
      resetForm()
    }
  }

  /**
   * domain and IP address regex
   *
   * example of matches:
   *
   * "vercel.com"
   * "www.vercel.com"
   * "uptime-monitor-fe.vercel.app"
   * "https://uptime-monitor-fe.vercel.app/"
   * "127.0.0.0"
   *
   */
  const domainRegex =
    /^((ftp|http|https):\/\/)?(www.)?(?!.*(ftp|http|https|www.))[a-zA-Z0-9_-]+(\.[a-zA-Z]+)+((\/)[\w#]+)*(\/\w+\?[a-zA-Z0-9_]+=\w+(&[a-zA-Z0-9_]+=\w+)*)?$|^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.){3}(25[0-5]|(2[0-4]|1\d|[1-9]|)\d)$/gm

  const schema = object({
    SMTP_ADMIN_EMAIL: string().when([], {
      is: () => {
        return enableSmtp
      },
      then: (schema) => schema.email('Must be a valid email').required('Admin Email is required'),
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
        schema.min(1, 'Must be more than 0').max(32767, 'Must not be more than 32,767 an hour'),
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

  const isLoaded = authConfig.isLoaded

  return (
    <>
      <Form
        id="auth-config-general-form"
        initialValues={generateInitialValues(authConfig.config)}
        onSubmit={async (values: any, { setSubmitting, resetForm }: any) => {
          const payload = { ...values }
          payload.SMTP_PORT = values.SMTP_PORT.toString()

          // remove rendundant value
          delete payload.ENABLE_SMTP

          if (!enableSmtp) {
            payload.SMTP_ADMIN_EMAIL = null
            payload.SMTP_SENDER_NAME = null
            payload.SMTP_USER = null
            payload.SMTP_HOST = null
            payload.SMTP_PASS = null
            payload.SMTP_PORT = null
            payload.SMTP_MAX_FREQUENCY = 60
          }

          try {
            setSubmitting(true)
            await authConfig.update(payload)
            setSubmitting(false)
            ui.setNotification({
              category: 'success',
              message: `Updated settings`,
            })
            console.log('payload', payload)
            resetForm({
              values: !enableSmtp ? generateInitialValues(payload) : payload,
              initialValues: generateInitialValues(payload),
            })
          } catch (error) {
            ui.setNotification({
              category: 'error',
              message: `Failed to update settings`,
            })
            setSubmitting(false)
          }
        }}
        validationSchema={schema}
      >
        {({ isSubmitting, handleReset, resetForm, values, initialValues }: any) => {
          /**
           * Tracks changes in form
           */
          const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

          /**
           * Form is reset once remote data is loaded in store
           */
          useEffect(() => {
            checkSmtpState(authConfig.config, () =>
              resetForm({
                values: generateInitialValues(authConfig.config),
                initialValues: generateInitialValues(authConfig.config),
              })
            )
          }, [authConfig.isLoaded])

          return (
            <>
              <FormHeader
                title="SMTP Settings"
                description={`You can use your own SMTP server instead of the built-in email service.`}
              />
              <FormPanel
                footer={
                  <div className="flex justify-between py-4 px-8">
                    <FormActions
                      handleReset={handleReset}
                      isSubmitting={isSubmitting}
                      hasChanges={hasChanges}
                      helper={'Learn more about global Auth settings'}
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
                      onChange={() => {
                        // resetForm({ values: values, initialValues: INITIAL_VALUES })
                        setEnableSmtp(!enableSmtp)
                      }}
                      descriptionText="Emails will be sent using your custom SMTP provider"
                    />
                  </FormSectionContent>
                </FormSection>
                <div className="border-scale-400 border-t"></div>
                <FormSection
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
                <div className="border-scale-400 border-t"></div>
                <FormSection
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

                    <Input
                      type="number"
                      name="SMTP_PORT"
                      placeholder="587"
                      id="SMTP_PORT"
                      label="Port number"
                      // @ts-ignore
                      descriptionText={
                        <>
                          <span className="block">
                            Port used by your SMTP server. Common ports include 25, 465, and 587.{' '}
                          </span>
                          <span className="mt-2 block">
                            Avoid using port 25 as modern SMTP email clients shouldn't use this
                            port, it is traditionally blocked by residential ISPs and Cloud Hosting
                            Providers, to curb the amount of spam.
                          </span>
                        </>
                      }
                    />
                    <Input
                      type="number"
                      name="SMTP_MAX_FREQUENCY"
                      id="SMTP_MAX_FREQUENCY"
                      min={0}
                      label="Rate limit"
                      descriptionText="Maximum number of emails sent per hour"
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
                      label="Password"
                      placeholder="SMTP Password"
                    />
                  </FormSectionContent>
                </FormSection>
              </FormPanel>
            </>
          )
        }}
      </Form>
    </>
  )
})

export { SmtpForm }
