import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Form,
  IconAlertCircle,
  IconAlertTriangle,
  Toggle,
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
import { useCheckPermissions, useStore, useFlag } from 'hooks'

import SchemaFunctionSelector from './SchemaFunctionSelector'

const schema = object({
  HOOKS_CUSTOM_ACCESS_TOKEN_ENABLED: boolean(),
  HOOKS_CUSTOM_ACCESS_TOKEN_URI: string(),
})

const formId = 'auth-basic-hooks-form'

const BasicHooksConfig = observer(() => {
  const { ui, meta } = useStore()
  const { ref: projectRef } = useParams()
  const {
    data: authConfig,
    error: authConfigError,
    isLoading,
    isError,
    isSuccess,
  } = useAuthConfigQuery({ projectRef })
  const { mutate: updateAuthConfig, isLoading: isUpdatingConfig } = useAuthConfigUpdateMutation()

  const customizeAccessTokenReleased = useFlag('authHooksCustomizeAccessToken')

  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  // TODO: Remove as any once these properties are defined in Auth Config types
  const INITIAL_VALUES = {
    ...(customizeAccessTokenReleased
      ? {
          HOOK_CUSTOM_ACCESS_TOKEN_ENABLED: authConfig?.HOOK_CUSTOM_ACCESS_TOKEN_ENABLED || false,
          HOOK_CUSTOM_ACCESS_TOKEN_URI: authConfig?.HOOK_CUSTOM_ACCESS_TOKEN_URI || '',
        }
      : null),
  }

  const onSubmit = (values: any, { resetForm }: any) => {
    const payload = { ...values }

    if (payload.HOOK_CUSTOM_ACCESS_TOKEN_URI === '') {
      payload.HOOK_CUSTOM_ACCESS_TOKEN_URI = null
    }

    updateAuthConfig(
      { projectRef: projectRef!, config: payload },
      {
        onError: () => {
          ui.setNotification({
            category: 'error',
            message: `Failed to update settings`,
          })
        },
        onSuccess: () => {
          ui.setNotification({
            category: 'success',
            message: `Successfully updated settings`,
          })
          resetForm({ values: values, initialValues: values })
        },
      }
    )
  }

  useEffect(() => {
    if (ui.selectedProjectRef) meta.functions.load()
  }, [ui.selectedProjectRef])

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
        useEffect(() => {
          if (isSuccess) {
            resetForm({ values: INITIAL_VALUES, initialValues: INITIAL_VALUES })
          }
        }, [isSuccess])

        return (
          <>
            <FormHeader
              title="Auth Hooks (Beta)"
              description="Use PostgreSQL functions to customize the behavior of Supabase Auth to meet your needs."
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
                  <SchemaFunctionSelector
                    id="HOOK_CUSTOM_ACCESS_TOKEN_URI"
                    descriptionText="Select the function to be called by Supabase Auth each time a new JWT is created. It should return the claims you wish to be present in the JWT."
                    values={values}
                    setFieldValue={setFieldValue}
                    disabled={!canUpdateConfig || !customizeAccessTokenReleased}
                  />
                  {!customizeAccessTokenReleased && (
                    <Alert_Shadcn_ variant="default">
                      <AlertTitle_Shadcn_>Coming soon!</AlertTitle_Shadcn_>
                      <AlertDescription_Shadcn_>
                        This hook is not available yet on your project.
                      </AlertDescription_Shadcn_>
                    </Alert_Shadcn_>
                  )}
                  {values.HOOK_CUSTOM_ACCESS_TOKEN_URI && (
                    <Toggle
                      id="HOOK_CUSTOM_ACCESS_TOKEN_ENABLED"
                      size="medium"
                      label="Enable hook"
                      layout="flex"
                      disabled={!canUpdateConfig || !customizeAccessTokenReleased}
                    />
                  )}
                </FormSectionContent>
              </FormSection>
              <div className="border-t border-muted"></div>
            </FormPanel>
          </>
        )
      }}
    </Form>
  )
})

export default BasicHooksConfig
