import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Form,
  IconAlertCircle,
  Toggle,
  Input,
} from 'ui'
import { boolean, object, string } from 'yup'

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
import { useCheckPermissions } from 'hooks'
import SchemaFunctionSelector from './SchemaFunctionSelector'
import HookSelector from './HookSelector'

const schema = object({
  HOOKS_CUSTOM_ACCESS_TOKEN_ENABLED: boolean(),
  HOOKS_CUSTOM_ACCESS_TOKEN_URI: string().url(),
  HOOKS_CUSTOM_ACCESS_TOKEN_SECRETS: string(),
  HOOKS_SEND_SMS_ENABLED: boolean(),
  HOOKS_SEND_SMS_URI: string().url(),
  HOOKS_SEND_SMS_SECRETS: string(),
  HOOKS_SEND_SMS_URI: string(),
  HOOKS_SEND_EMAIL_ENABLED: boolean(),
  HOOKS_SEND_EMAIL_URI: string().url(),
  HOOKS_SEND_EMAIL_URI: string(),
  HOOKS_SEND_EMAIL_SECRETS: string(),
})

const formId = 'auth-basic-hooks-form'

const BasicHooksConfig = () => {
  const { ref: projectRef } = useParams()
  const {
    data: authConfig,
    error: authConfigError,
    isLoading,
    isError,
    isSuccess,
  } = useAuthConfigQuery({ projectRef })
  const { mutate: updateAuthConfig, isLoading: isUpdatingConfig } = useAuthConfigUpdateMutation()
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  // TODO: Remove as any once these properties are defined in Auth Config types
  const INITIAL_VALUES = {
    HOOK_CUSTOM_ACCESS_TOKEN_ENABLED: authConfig?.HOOK_CUSTOM_ACCESS_TOKEN_ENABLED || false,
    HOOK_CUSTOM_ACCESS_TOKEN_URI: authConfig?.HOOK_CUSTOM_ACCESS_TOKEN_URI || '',
    HOOK_CUSTOM_ACCESS_TOKEN_SECRETS: authConfig?.HOOK_CUSTOM_ACCESS_TOKEN_SECRETS || '',
    HOOK_SEND_SMS_ENABLED: authConfig?.HOOK_SEND_SMS_ENABLED || false,
    HOOK_SEND_SMS_URI: authConfig?.HOOK_SEND_SMS_URI || '',
    HOOK_SEND_SMS_SECRETS: authConfig?.HOOK_SEND_SMS_SECRETS || '',
    HOOK_SEND_EMAIL_ENABLED: authConfig?.HOOK_CUSTOM_ACCESS_TOKEN_ENABLED || false,
    HOOK_SEND_EMAIL_URI: authConfig?.HOOK_CUSTOM_ACCESS_TOKEN_URI || '',
    HOOK_SEND_EMAIL_SECRETS: authConfig?.HOOK_SEND_EMAIL_SECRETS || '',
  }

  const onSubmit = (values: any, { resetForm }: any) => {
    const payload = { ...values }

    if (payload.HOOK_CUSTOM_ACCESS_TOKEN_URI === '') {
      payload.HOOK_CUSTOM_ACCESS_TOKEN_URI = null
    }

    if (payload.HOOK_SEND_SMS_URI === '') {
      payload.HOOK_SEND_SMS_URI = null
    }

    if (payload.HOOK_SEND_EMAIL_URI === '') {
      payload.HOOK_SEND_EMAIL_URI = null
    }

    if (payload.HOOK_CUSTOM_ACCESS_TOKEN_SECRETS === '') {
      payload.HOOK_CUSTOM_ACCESS_TOKEN_SECRETS = null
    }
    if (payload.HOOK_SEND_SMS_SECRETS === '') {
      payload.HOOK_SEND_SMS_SECRETS = null
    }

    if (payload.HOOK_SEND_EMAIL_SECRETS === '') {
      payload.HOOK_SEND_EMAIL_SECRETS = null
    }

    updateAuthConfig(
      { projectRef: projectRef!, config: payload },
      {
        onError: () => toast.error(`Failed to update settings`),
        onSuccess: () => {
          toast.success(`Successfully updated settings`)
          resetForm({ values: values, initialValues: values })
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
    <Form id={formId} initialValues={INITIAL_VALUES} onSubmit={onSubmit} validationSchema={schema}>
      {({ handleReset, resetForm, values, initialValues, setFieldValue }: any) => {
        const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

        // Form is reset once remote data is loaded in store
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          if (isSuccess) {
            resetForm({ values: INITIAL_VALUES, initialValues: INITIAL_VALUES })
          }
        }, [isSuccess])

        return (
          <>
            <FormHeader
              title="Auth Hooks"
              description="Use Postgres functions or HTTP endpoints to customize the behavior of Supabase Auth to meet your needs."
            />
            <FormPanel
              disabled={true}
              footer={
                <div className="flex py-4 px-8">
                  <FormActions
                    form={formId}
                    isSubmitting={isUpdatingConfig}
                    hasChanges={hasChanges}
                    handleReset={handleReset}
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
              <FormSection
                header={<FormSectionLabel>Customize Access Token (JWT) Claims</FormSectionLabel>}
              >
                <FormSectionContent loading={isLoading}>
                  <HookSelector
                    uriId="HOOK_CUSTOM_ACCESS_TOKEN_URI"
                    enabledId="HOOK_CUSTOM_ACCESS_TOKEN_ENABLED"
                    secretId="HOOK_CUSTOM_ACCESS_TOKEN_SECRETS"
                    descriptionTextPostgres="Select the function to be called by Supabase Auth each time a new JWT is created. It should return the claims you wish to be present in the JWT."
                    descriptionTextWeb="Supabase Auth will send a HTTP POST request to this URL each time a new JWT is created. It should return the claims you wish to be present in the JWT."
                    values={values}
                    setFieldValue={setFieldValue}
                  />
                </FormSectionContent>
              </FormSection>

              <FormSection header={<FormSectionLabel>Send SMS Hook</FormSectionLabel>}>
                <FormSectionContent loading={isLoading}>
                  <HookSelector
                    uriId="HOOK_SEND_SMS_URI"
                    enabledId="HOOK_SEND_SMS_ENABLED"
                    secretId="HOOK_SEND_SMS_SECRETS"
                    descriptionTextPostgres="Select the function to be called by Supabase Auth each time an SMS message needs to be sent."
                    descriptionTextWeb="Supabase Auth will send a HTTP POST request to this URL each time an SMS message needs to be sent."
                    values={values}
                    setFieldValue={setFieldValue}
                  />
                </FormSectionContent>
              </FormSection>
              <FormSection header={<FormSectionLabel>Send Email Hook</FormSectionLabel>}>
                <FormSectionContent loading={isLoading}>
                  <HookSelector
                    uriId="HOOK_SEND_EMAIL_URI"
                    enabledId="HOOK_SEND_EMAIL_ENABLED"
                    secretId="HOOK_SEND_EMAIL_SECRETS"
                    descriptionTextPostgres="Select the function to be called by Supabase Auth each time an email message needs to be sent."
                    descriptionTextWeb="Supabase Auth will send a HTTP POST request to this URL each time an email message needs to be sent."
                    values={values}
                    setFieldValue={setFieldValue}
                  />
                </FormSectionContent>
              </FormSection>
              <div className="border-t border-muted"></div>
            </FormPanel>
          </>
        )
      }}
    </Form>
  )
}

export default BasicHooksConfig
