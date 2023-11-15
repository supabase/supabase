import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'

import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Form,
  IconAlertCircle,
  IconAlertTriangle,
  IconEye,
  IconEyeOff,
  Input,
  InputNumber,
  Toggle,
} from 'ui'
import { number, object, string } from 'yup'

import { useParams } from 'common'
import {
  FormActions,
  FormHeader,
  FormPanel,
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from 'components/ui/Forms'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useCheckPermissions, useStore } from 'hooks'
import EmailRateLimitsAlert from '../EmailRateLimitsAlert'
import { urlRegex } from './../Auth.constants'
import { defaultDisabledSmtpFormValues } from './SmtpForm.constants'
import { generateFormValues, isSmtpEnabled } from './SmtpForm.utils'

const SmtpForm = () => {
  const { ui } = useStore()
  const { ref: projectRef } = useParams()
  const {
    data: authConfig,
    error: authConfigError,
    isLoading,
    isError,
    isSuccess,
  } = useAuthConfigQuery({ projectRef })
  const { mutate: updateAuthConfig, isLoading: isUpdatingConfig } = useAuthConfigUpdateMutation()

  const [enableSmtp, setEnableSmtp] = useState(false)
  const [hidden, setHidden] = useState(true)

  const formId = 'auth-config-smtp-form'
  const initialValues = generateFormValues(authConfig)
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  useEffect(() => {
    if (isSuccess && isSmtpEnabled(authConfig)) {
      setEnableSmtp(true)
    }
  }, [isSuccess, authConfig])

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
          .matches(urlRegex, 'Must be a valid URL or IP address')
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

  const onSubmit = (values: any, { resetForm }: any) => {
    const payload = enableSmtp ? values : defaultDisabledSmtpFormValues

    // Format payload: Remove redundant value + convert port to string
    delete payload.ENABLE_SMTP
    payload.SMTP_PORT = payload.SMTP_PORT ? payload.SMTP_PORT.toString() : payload.SMTP_PORT

    updateAuthConfig(
      { projectRef: projectRef!, config: payload },
      {
        onError: (error) => {
          ui.setNotification({ category: 'error', message: 'Failed to update settings', error })
        },
        onSuccess: () => {
          setHidden(true)
          const updatedFormValues = generateFormValues(payload)
          resetForm({ values: updatedFormValues, initialValues: updatedFormValues })
          ui.setNotification({ category: 'success', message: 'Successfully updated settings' })
        },
      }
    )
  }

  if (isError) {
    return (
      <Alert_Shadcn_ variant="destructive">
        <IconAlertCircle strokeWidth={2} />
        <AlertTitle_Shadcn_>Failed to retrieve auth configuration</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>{authConfigError.message}</AlertDescription_Shadcn_>
      </Alert_Shadcn_>
    )
  }

  return (
    <Form id={formId} initialValues={initialValues} onSubmit={onSubmit} validationSchema={schema}>
      {({ resetForm, values }: any) => {
        const isValidSmtpConfig = isSmtpEnabled(values)
        const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

        // [Alaister] although this "technically" is breaking the rules of React hooks
        // it won't error because the hooks are always rendered in the same order
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          if (isSuccess) {
            const formValues = generateFormValues(authConfig)
            resetForm({ values: formValues, initialValues: formValues })
          }
        }, [isSuccess, authConfig])

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
                <div className="flex py-4 px-8">
                  <FormActions
                    form={formId}
                    isSubmitting={isUpdatingConfig}
                    hasChanges={hasChanges}
                    handleReset={onResetForm}
                    disabled={!canUpdateConfig}
                    helper={
                      !canUpdateConfig
                        ? 'You need additional permissions to update authentication settings'
                        : undefined
                    }
                  />
                </div>
              }
            >
              <FormSection>
                <FormSectionContent loading={isLoading}>
                  <Toggle
                    name="ENABLE_SMTP"
                    size="small"
                    label="Enable Custom SMTP"
                    layout="flex"
                    checked={enableSmtp}
                    disabled={!canUpdateConfig}
                    // @ts-ignore
                    onChange={(value: boolean) => setEnableSmtp(value)}
                    descriptionText="Emails will be sent using your custom SMTP provider"
                  />
                </FormSectionContent>
              </FormSection>

              {enableSmtp ? (
                !isValidSmtpConfig && (
                  <div className="mx-8 mb-8 -mt-4">
                    <Alert_Shadcn_ variant="warning">
                      <IconAlertTriangle strokeWidth={2} />
                      <AlertTitle_Shadcn_>All fields below must be filled</AlertTitle_Shadcn_>
                      <AlertDescription_Shadcn_>
                        The following fields must be filled before custom SMTP can be properly
                        enabled
                      </AlertDescription_Shadcn_>
                    </Alert_Shadcn_>
                  </div>
                )
              ) : (
                <div className="mx-8 mb-8 -mt-4">
                  <EmailRateLimitsAlert />
                </div>
              )}

              <FormSection
                visible={enableSmtp}
                header={<FormSectionLabel>Sender details</FormSectionLabel>}
                disabled={!enableSmtp}
              >
                <FormSectionContent loading={isLoading}>
                  <Input
                    name="SMTP_ADMIN_EMAIL"
                    id="SMTP_ADMIN_EMAIL"
                    label="Sender email"
                    descriptionText="This is the email address the emails are sent from"
                    placeholder="noreply@yourdomain.com"
                    disabled={!canUpdateConfig}
                  />
                  <Input
                    name="SMTP_SENDER_NAME"
                    id="SMTP_SENDER_NAME"
                    label="Sender name"
                    descriptionText="Name displayed in the recipient's inbox"
                    placeholder="The name shown on the email"
                    disabled={!canUpdateConfig}
                  />
                </FormSectionContent>
              </FormSection>

              <FormSection
                visible={enableSmtp}
                disabled={!enableSmtp}
                header={
                  <FormSectionLabel>
                    <span>SMTP Provider Settings</span>
                    <p className="my-4 text-foreground-lighter">
                      Your SMTP Credentials will always be encrypted in our database.
                    </p>
                  </FormSectionLabel>
                }
              >
                <FormSectionContent loading={isLoading}>
                  <Input
                    name="SMTP_HOST"
                    placeholder="your.smtp.host.com"
                    id="SMTP_HOST"
                    label="Host"
                    descriptionText="Hostname or IP address of your SMTP server."
                    disabled={!canUpdateConfig}
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
                    disabled={!canUpdateConfig}
                  />
                  <InputNumber
                    id="SMTP_MAX_FREQUENCY"
                    name="SMTP_MAX_FREQUENCY"
                    label="Minimum interval between emails being sent"
                    descriptionText="How long between each email can a new email be sent via your SMTP server."
                    actions={<span className="mr-3 text-foreground-lighter">seconds</span>}
                    disabled={!canUpdateConfig}
                  />
                  <Input
                    name="SMTP_USER"
                    id="SMTP_USER"
                    label="Username"
                    placeholder="SMTP Username"
                    disabled={!canUpdateConfig}
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
                    disabled={!canUpdateConfig}
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
