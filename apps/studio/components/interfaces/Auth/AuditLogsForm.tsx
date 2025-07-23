import { yupResolver } from '@hookform/resolvers/yup'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { boolean, object } from 'yup'

import { useParams } from 'common'
import { ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Card,
  CardContent,
  CardFooter,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Switch,
  WarningIcon,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const schema = object({
  GOTRUE_AUDITLOG_DISABLE_POSTGRES: boolean().required(),
})

const AuditLogsForm = () => {
  const { ref: projectRef } = useParams()
  const canReadConfig = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  const [isUpdatingAuditLogs, setIsUpdatingAuditLogs] = useState(false)

  const {
    data: authConfig,
    error: authConfigError,
    isLoading,
    isError,
  } = useAuthConfigQuery({ projectRef })

  const { mutate: updateAuthConfig, isLoading: isUpdatingConfig } = useAuthConfigUpdateMutation()

  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      GOTRUE_AUDITLOG_DISABLE_POSTGRES: false,
    },
  })

  useEffect(() => {
    if (authConfig && !isUpdatingAuditLogs) {
      form.reset({
        // TODO :: gonna fix when the API is udpated.
        GOTRUE_AUDITLOG_DISABLE_POSTGRES: authConfig?.GOTRUE_AUDITLOG_DISABLE_POSTGRES ?? false,
      })
    }
  }, [authConfig, isUpdatingAuditLogs])

  const onSubmitAuditLogs = (values: any) => {
    if (!projectRef) return console.error('Project ref is required')

    setIsUpdatingAuditLogs(true)

    updateAuthConfig(
      { projectRef: projectRef, config: values },
      {
        onError: (error) => {
          toast.error(`Failed to update audit logs settings: ${error?.message}`)
          setIsUpdatingAuditLogs(false)
        },
        onSuccess: () => {
          toast.success('Successfully updated audit logs settings')
          setIsUpdatingAuditLogs(false)
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
    return <NoPermission resourceText="view audit logs settings" />
  }

  return (
    <>
      <ScaffoldSection isFullWidth>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-foreground">About Audit Logs</h3>
            <p className="text-sm text-foreground-light mt-2">
              Audit logs provide comprehensive tracking of auth events in your project.
              By default, all auth-related actions such as user sign-ups, sign-ins, password changes, and administrative actions are logged to both
              your PostgreSQL database and your project's logs dashboard (since{' '}
              <strong>August 1, 2025</strong>, audit logs are being written to the logs dashboard).
            </p>
            <p className="text-sm text-foreground-light mt-2">
              <strong>Note:</strong> This feature is currently in beta. If you disable PostgreSQL 
              storage, you can access audit logs through the{' '}
              <a 
                href={`/project/${projectRef}/logs/auth-logs?s=auth_audit_event`}
                className="text-brand underline hover:no-underline"
              >
                Auth logs section
              </a>.
            </p>
            <p className="text-sm text-foreground-light mt-2">
              For detailed information about audit logs, including what events are tracked and how
              to query them, please refer to our{' '}
              <a href="#" className="text-brand underline hover:no-underline">
                audit logs documentation
              </a>
              .
            </p>
          </div>

          <ScaffoldSectionTitle className="mb-4">Settings</ScaffoldSectionTitle>

          <Form_Shadcn_ {...form}>
            <form onSubmit={form.handleSubmit(onSubmitAuditLogs)} className="space-y-4">
              <Card>
                <CardContent>
                  <FormField_Shadcn_
                    control={form.control}
                    name="GOTRUE_AUDITLOG_DISABLE_POSTGRES"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Disable PostgreSQL audit logs"
                        description={
                          <>
                            When enabled, audit logs will only be written to your project's logs dashboard and not to the{' '}
                            <code className="text-xs bg-surface-200 px-1 py-0.5 rounded">audit_log_entries</code>{' '}
                            table in your PostgreSQL database. This can help reduce database storage usage while maintaining audit trail visibility in your logs.
                            <br /><br />
                            <strong>Important:</strong> Disabling PostgreSQL storage will not automatically migrate or transfer existing audit log data. Any future audit logs will only appear in your logs dashboard. You are responsible for backing up, copying, or migrating existing data from the{' '}
                            <code className="text-xs bg-surface-200 px-1 py-0.5 rounded">audit_log_entries</code>{' '}
                            table if needed.
                          </>
                        }
                      >
                        <FormControl_Shadcn_>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!canUpdateConfig}
                          />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>

                <CardFooter className="justify-end space-x-2">
                  {form.formState.isDirty && (
                    <Button type="default" onClick={() => form.reset()}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="primary"
                    htmlType="submit"
                    disabled={!canUpdateConfig || isUpdatingAuditLogs || !form.formState.isDirty}
                    loading={isUpdatingAuditLogs}
                  >
                    Save changes
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form_Shadcn_>
        </div>
      </ScaffoldSection>
    </>
  )
}

export default AuditLogsForm
