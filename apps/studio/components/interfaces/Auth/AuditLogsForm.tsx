import { yupResolver } from '@hookform/resolvers/yup'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { boolean, object } from 'yup'

import { useParams } from 'common'
import { AlertError } from 'components/ui/AlertError'
import { InlineLink } from 'components/ui/InlineLink'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useTablesQuery } from 'data/tables/tables-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Switch,
} from 'ui'
import { Admonition, GenericSkeletonLoader } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

const schema = object({
  AUDIT_LOG_DISABLE_POSTGRES: boolean().required(),
})

const AUDIT_LOG_ENTRIES_TABLE = 'audit_log_entries'

export const AuditLogsForm = () => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const { can: canUpdateConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  const { data: tables = [] } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    includeColumns: false,
    schema: 'auth',
  })
  const auditLogTable = tables.find((x) => x.name === AUDIT_LOG_ENTRIES_TABLE)

  const {
    data: authConfig,
    error: authConfigError,
    isError,
    isPending: isLoading,
  } = useAuthConfigQuery({ projectRef })

  const { mutate: updateAuthConfig, isPending: isUpdatingConfig } = useAuthConfigUpdateMutation({
    onError: (error) => {
      toast.error(`Failed to update audit logs: ${error?.message}`)
    },
    onSuccess: () => {
      toast.success('Successfully updated audit logs settings')
    },
  })

  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: { AUDIT_LOG_DISABLE_POSTGRES: false },
  })
  const { AUDIT_LOG_DISABLE_POSTGRES: formValueDisablePostgres } = form.watch()
  const currentlyDisabled = authConfig?.AUDIT_LOG_DISABLE_POSTGRES ?? false
  const isDisabling = !currentlyDisabled && formValueDisablePostgres

  const onSubmitAuditLogs = (values: any) => {
    if (!projectRef) return console.error('Project ref is required')
    updateAuthConfig({ projectRef: projectRef, config: values })
  }

  useEffect(() => {
    if (authConfig) {
      form.reset({ AUDIT_LOG_DISABLE_POSTGRES: authConfig?.AUDIT_LOG_DISABLE_POSTGRES ?? false })
    }
  }, [authConfig])

  if (isError) {
    return (
      <PageSection>
        <PageSectionContent>
          <AlertError
            error={authConfigError}
            subject="Failed to retrieve auth configuration for hooks"
          />
        </PageSectionContent>
      </PageSection>
    )
  }

  if (isLoading) {
    return (
      <PageSection>
        <PageSectionContent>
          <GenericSkeletonLoader />
        </PageSectionContent>
      </PageSection>
    )
  }

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Settings</PageSectionTitle>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Form_Shadcn_ {...form}>
          <form onSubmit={form.handleSubmit(onSubmitAuditLogs)} className="space-y-4">
            <Card>
              <CardContent>
                <FormField_Shadcn_
                  control={form.control}
                  name="AUDIT_LOG_DISABLE_POSTGRES"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Write audit logs to the database"
                      description={
                        <p className="text-sm prose text-foreground-lighter max-w-full">
                          When enabled, audit logs are written to the{' '}
                          <InlineLink
                            target="_blank"
                            rel="noopener noreferrer"
                            href={`/project/${projectRef}/editor/${auditLogTable?.id}`}
                          >
                            <code className="text-code-inline">{AUDIT_LOG_ENTRIES_TABLE}</code>
                          </InlineLink>{' '}
                          table.
                          <br />
                          You can disable this to reduce disk usage while still accessing logs
                          through the{' '}
                          <InlineLink
                            href={`/project/${projectRef}/logs/explorer?q=select%0A++cast(timestamp+as+datetime)+as+timestamp%2C%0A++event_message%2C+metadata+%0Afrom+auth_audit_logs+%0Alimit+10%0A`}
                          >
                            Auth logs
                          </InlineLink>
                          .
                        </p>
                      }
                    >
                      <FormControl_Shadcn_>
                        <Switch
                          checked={!field.value}
                          onCheckedChange={(value) => field.onChange(!value)}
                          disabled={!canUpdateConfig}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
                {isDisabling && (
                  <Admonition
                    type="warning"
                    className="mt-4"
                    title="Disabling PostgreSQL storage will not automatically migrate or transfer existing audit log data"
                    description={
                      <p>
                        Future audit logs will only appear in the project’s{' '}
                        <InlineLink
                          href={`/project/${projectRef}/logs/explorer?q=select%0A++cast(timestamp+as+datetime)+as+timestamp%2C%0A++event_message%2C+metadata+%0Afrom+auth_audit_logs+%0Alimit+10%0A`}
                        >
                          auth logs
                        </InlineLink>
                        . You are responsible for backing up, copying, or migrating existing data
                        from the{' '}
                        <code className="text-code-inline !break-keep">
                          {AUDIT_LOG_ENTRIES_TABLE}
                        </code>{' '}
                        table if needed.
                      </p>
                    }
                  />
                )}
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
                  disabled={!canUpdateConfig || isUpdatingConfig || !form.formState.isDirty}
                  loading={isUpdatingConfig}
                >
                  Save changes
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form_Shadcn_>
      </PageSectionContent>
    </PageSection>
  )
}
