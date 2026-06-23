import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { useEffect, useMemo } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Card, CardContent, CardFooter, Form, FormControl, FormField, Switch } from 'ui'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import z from 'zod'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { DocsButton } from '@/components/ui/DocsButton'
import { usePostgresConfigurationUpdateMutation } from '@/data/config/postgres-config-mutation'
import { postgresConfigurationQueryOptions } from '@/data/config/postgres-config-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'

const FormSchema = z.object({
  log_connections: z.boolean(),
  log_disconnections: z.boolean(),
})

export const DatabaseLogs = () => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { can: canUpdatePostgresConfiguration } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'projects',
    { resource: { project_id: project?.id } }
  )

  const { data: postgresConfig, isSuccess } = useQuery(
    postgresConfigurationQueryOptions({ projectRef })
  )

  const { mutate: updatePostgresConfig, isPending: isSaving } =
    usePostgresConfigurationUpdateMutation({
      onSuccess: () => toast('Successfully updated logging settings'),
    })

  const defaultValues = useMemo(
    () => ({
      log_connections: postgresConfig?.log_connections ?? false,
      log_disconnections: postgresConfig?.log_disconnections ?? false,
    }),
    [postgresConfig]
  )

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    values: defaultValues,
  })
  const hasChanges = form.formState.isDirty

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = (payload) => {
    if (!projectRef) return
    updatePostgresConfig({ projectRef, payload })
  }

  useEffect(() => {
    if (isSuccess) form.reset(defaultValues)
  }, [isSuccess, defaultValues, form])

  return (
    <PageSection id="postgres-configuration">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Database Logs</PageSectionTitle>
        </PageSectionSummary>
        <PageSectionAside className="flex items-center gap-x-2">
          {/* [Joshen] This URL needs to be updated to the correct Docs URL */}
          <DocsButton href={`${DOCS_URL}/guides/platform/network-restrictions`} />
        </PageSectionAside>
      </PageSectionMeta>
      <PageSectionContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardContent>
                <FormField
                  control={form.control}
                  name="log_connections"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Log connections"
                      description="Enables logging for each successful connection to the database"
                      className="[&>div:first-child]:xl:w-1/5"
                    >
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </CardContent>
              <CardContent>
                <FormField
                  control={form.control}
                  name="log_disconnections"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Log disconnections"
                      description="Enables logging for the end of each session, including its duration"
                      className="[&>div:first-child]:xl:w-1/5"
                    >
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </CardContent>
              <CardFooter className="gap-x-2 justify-end">
                <Button
                  variant="default"
                  disabled={!hasChanges || isSaving}
                  onClick={() => form.reset(defaultValues)}
                >
                  Cancel
                </Button>
                <ButtonTooltip
                  type="submit"
                  variant="primary"
                  loading={isSaving}
                  disabled={!hasChanges || !canUpdatePostgresConfiguration}
                  tooltip={{
                    content: {
                      side: 'bottom',
                      text: !canUpdatePostgresConfiguration
                        ? 'You need additional permissions to update this setting'
                        : undefined,
                    },
                  }}
                >
                  Save
                </ButtonTooltip>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </PageSectionContent>
    </PageSection>
  )
}
