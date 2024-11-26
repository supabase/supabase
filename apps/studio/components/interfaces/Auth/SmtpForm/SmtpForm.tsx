import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { number, object, string } from 'yup'

import { Markdown } from 'components/interfaces/Markdown'
import { FormActions } from 'components/ui/Forms/FormActions'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import NoPermission from 'components/ui/NoPermission'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Form,
  Input,
  InputNumber,
  Toggle,
  WarningIcon,
} from 'ui'
import EmailRateLimitsAlert from '../EmailRateLimitsAlert'
import { urlRegex } from './../Auth.constants'
import { defaultDisabledSmtpFormValues } from './SmtpForm.constants'
import { generateFormValues, isSmtpEnabled } from './SmtpForm.utils'
import { AlertTriangle, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

const SmtpForm = () => {
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
  const canReadConfig = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
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
          .matches(urlRegex({ excludeSimpleDomains: false }), 'Must be a valid URL or IP address')
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
        return enableSmtp && authConfig?.SMTP_PASS === null
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

    // the SMTP_PASS is write-only, it's never shown. If we don't delete it from the payload, it will replace the
    // previously saved value with an empty one
    if (payload.SMTP_PASS === '') {
      delete payload.SMTP_PASS
    }

    updateAuthConfig(
      { projectRef: projectRef!, config: payload },
      {
        onError: (error) => {
          toast.error(`Failed to update settings: ${error.message}`)
        },
        onSuccess: () => {
          setHidden(true)
          toast.success('Successfully updated settings')
          const updatedFormValues = generateFormValues(payload)
          resetForm({ values: updatedFormValues, initialValues: updatedFormValues })
        },
      }
    )
  }

  if (isError) {
    return (
      <Alert_Shadcn_ variant="destructive">
        <WarningIcon />
        <AlertTitle_Shadcn_>Failed to retrieve auth configuration</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>{authConfigError.message}</AlertDescription_Shadcn_>
      </Alert_Shadcn_>
    )
  }

  if (!canReadConfig) {
    return <NoPermission resourceText="view SMTP settings" />
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
                <FormSectionContent className="!col-span-12 !gap-y-2" loading={isLoading}>
                  <Toggle
                    size="small"
                    layout="flex"
                    name="ENABLE_SMTP"
                    label="Enable Custom SMTP"
                    checked={enableSmtp}
                    disabled={!canUpdateConfig}
                    // @ts-ignore
                    onChange={(value: boolean) => setEnableSmtp(value)}
                    descriptionText={
                      <p className="max-w-full prose text-sm text-foreground-lighter">
                        Emails will be sent using your custom SMTP provider. Email rate limits can
                        be adjusted{' '}
                        <Link
                          className="underline"
                          href={`/project/${projectRef}/auth/rate-limits`}
                        >
                          here
                        </Link>
                        .
                      </p>
                    }
                  />
                  {enableSmtp ? (
                    !isValidSmtpConfig && (
                      <div className="">
                        <Alert_Shadcn_ variant="warning">
                          <AlertTriangle strokeWidth={2} />
                          <AlertTitle_Shadcn_>All fields below must be filled</AlertTitle_Shadcn_>
                          <AlertDescription_Shadcn_>
                            The following fields must be filled before custom SMTP can be properly
                            enabled
                          </AlertDescription_Shadcn_>
                        </Alert_Shadcn_>
                      </div>
                    )
                  ) : (
                    <div className="">
                      <EmailRateLimitsAlert />
                    </div>
                  )}
                </FormSectionContent>
              </FormSection>

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
                  {values['SMTP_HOST'] && values['SMTP_HOST'].endsWith('.gmail.com') && (
                    <Alert_Shadcn_ variant="warning">
                      <AlertTriangle strokeWidth={2} />
                      <AlertTitle_Shadcn_>Check your SMTP provider</AlertTitle_Shadcn_>
                      <AlertDescription_Shadcn_>
                        Not all SMTP providers are designed for the email sending required by
                        Supabase Auth. It looks like the SMTP provider you entered is designed for
                        sending personal email messages and not for sending transactional messages.
                        Although you can ignore this warning, email deliverability may be impacted.
                      </AlertDescription_Shadcn_>
                    </Alert_Shadcn_>
                  )}
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
                    placeholder={authConfig?.SMTP_PASS === null ? 'SMTP Password' : '••••••••'}
                    actions={
                      <Button
                        icon={hidden ? <Eye /> : <EyeOff />}
                        type="default"
                        onClick={() => setHidden(!hidden)}
                      />
                    }
                    disabled={!canUpdateConfig}
                    descriptionText={
                      <span>
                        For security reasons, the password is write-only. Once saved, it cannot be
                        retrieved or displayed.
                      </span>
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

export default SmtpForm
