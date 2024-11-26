import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { DocsButton } from 'components/ui/DocsButton'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import {
  FormPanelContainer,
  FormPanelContent,
  FormPanelFooter,
} from 'components/ui/Forms/FormPanel'
import { useQueuesExposePostgrestStatusQuery } from 'data/database-queues/database-queues-expose-postgrest-status-query'
import {
  QUEUES_SCHEMA,
  useDatabaseQueueToggleExposeMutation,
} from 'data/database-queues/database-queues-toggle-postgrest-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  Switch,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { useProjectPostgrestConfigUpdateMutation } from 'data/config/project-postgrest-config-update-mutation'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'

// [Joshen] Not convinced with the UI and layout but getting the functionality out first

export const QueuesSettings = () => {
  const project = useSelectedProject()
  const canUpdatePostgrestConfig = useCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_postgrest'
  )
  const [isToggling, setIsToggling] = useState(false)

  const formSchema = z.object({ enable: z.boolean() })
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: { enable: false },
  })
  const { formState } = form
  const { enable } = form.watch()

  const { data: config, error: configError } = useProjectPostgrestConfigQuery({
    projectRef: project?.ref,
  })
  const {
    data: isExposed,
    isSuccess,
    isLoading,
  } = useQueuesExposePostgrestStatusQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const schemas = config?.db_schema.replace(/ /g, '').split(',') ?? []

  const { mutate: updatePostgrestConfig } = useProjectPostgrestConfigUpdateMutation({
    onSuccess: () => {
      if (enable) {
        toast.success('Queues can now be managed through client libraries or PostgREST endpoints!')
      } else {
        toast.success(
          'Queues can no longer be managed through client libraries or PostgREST endpoints'
        )
      }
      setIsToggling(false)
      form.reset({ enable })
    },
    onError: (error) => {
      setIsToggling(false)
      toast.error(`Failed to toggle queue exposure via PostgREST: ${error.message}`)
    },
  })

  const { mutate: toggleExposeQueuePostgrest } = useDatabaseQueueToggleExposeMutation({
    onSuccess: (_, values) => {
      if (project && config) {
        if (values.enable) {
          const updatedSchemas = schemas.concat([QUEUES_SCHEMA])
          updatePostgrestConfig({
            projectRef: project?.ref,
            dbSchema: updatedSchemas.join(', '),
            maxRows: config.max_rows,
            dbExtraSearchPath: config.db_extra_search_path,
            dbPool: config.db_pool,
          })
        } else {
          const updatedSchemas = schemas.filter((x) => x !== QUEUES_SCHEMA)
          updatePostgrestConfig({
            projectRef: project?.ref,
            dbSchema: updatedSchemas.join(', '),
            maxRows: config.max_rows,
            dbExtraSearchPath: config.db_extra_search_path,
            dbPool: config.db_pool,
          })
        }
      }
    },
    onError: (error) => {
      setIsToggling(false)
      toast.error(`Failed to toggle queue exposure via PostgREST: ${error.message}`)
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!project) return console.error('Project is required')
    if (configError) {
      return toast.error(
        `Failed to toggle queue exposure via PostgREST: Unable to retrieve PostgREST configuration (${configError.message})`
      )
    }

    setIsToggling(true)
    toggleExposeQueuePostgrest({
      projectRef: project.ref,
      connectionString: project.connectionString,
      enable: values.enable,
    })
  }

  useEffect(() => {
    if (isSuccess) form.reset({ enable: isExposed })
  }, [isSuccess])

  return (
    <div className="w-full flex flex-col gap-y-4 p-10">
      <FormHeader
        className="mb-0"
        title="Settings"
        description="Manage your queues via any client library or PostgREST endpoints"
      />
      <Form_Shadcn_ {...form}>
        <form id="pgmq-postgrest" onSubmit={form.handleSubmit(onSubmit)}>
          <FormPanelContainer>
            <FormPanelContent className="px-8 py-8">
              <FormField_Shadcn_
                control={form.control}
                name="enable"
                render={({ field }) => (
                  <FormItem_Shadcn_ className="w-full">
                    <FormItemLayout
                      className="w-full"
                      layout="flex"
                      label="Expose PGMQ via PostgREST"
                      description={
                        <>
                          <p>
                            When enabled, you will be able to use any Supabase client library or
                            PostgREST endpoints to manage your queues
                          </p>
                          <p className="mt-1">
                            The following database functions will be available to use from the{' '}
                            <code className="text-xs">{QUEUES_SCHEMA}</code> schema:
                          </p>
                          <p>
                            <code className="text-xs">queue_send</code>,{' '}
                            <code className="text-xs">queue_send_batch</code>,{' '}
                            <code className="text-xs">queue_read</code>,{' '}
                            <code className="text-xs">queue_pop</code>,
                            <code className="text-xs">queue_archive</code>, and
                            <code className="text-xs">queue_delete</code>
                          </p>
                        </>
                      }
                    >
                      <FormControl_Shadcn_>
                        <Switch
                          name="enable"
                          size="large"
                          disabled={isLoading || !canUpdatePostgrestConfig}
                          checked={field.value}
                          onCheckedChange={(value) => field.onChange(value)}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                    {formState.dirtyFields.enable && field.value === true && (
                      <Admonition type="warning" className="mt-2">
                        <p>
                          Queues will be exposed and managed through the{' '}
                          <code className="text-xs">{QUEUES_SCHEMA}</code> schema
                        </p>
                        <p className="text-foreground-light">
                          Database functions will be created in the{' '}
                          <code className="text-xs">{QUEUES_SCHEMA}</code> schema upon enabling,
                          where you can then call through any Supabase client library or PostgREST
                          endpoint to manage your queues. Permissions on individual queues can also
                          be further managed through privileges and row level security (RLS).
                        </p>
                        <p>
                          Please ensure that all queues have RLS enabled prior to enabling this
                          setting to prevent anonymous access.
                        </p>
                      </Admonition>
                    )}
                    {formState.dirtyFields.enable && field.value === false && (
                      <Admonition type="warning" className="mt-2">
                        <p>
                          The <code className="text-xs">{QUEUES_SCHEMA}</code> schema will be
                          removed once disabled
                        </p>
                        <p className="text-foreground-light">
                          Ensure that the database functions from the{' '}
                          <code className="text-xs">{QUEUES_SCHEMA}</code> schema are not in use
                          within your client applications before disabling.
                        </p>
                      </Admonition>
                    )}
                  </FormItem_Shadcn_>
                )}
              />
            </FormPanelContent>

            <FormPanelFooter className="flex px-8 py-4 flex items-center justify-between">
              <DocsButton
                abbrev={false}
                href="https://github.com/tembo-io/pgmq?tab=readme-ov-file#sql-examples"
              />
              <div className="flex items-center gap-x-2">
                <Button
                  type="default"
                  disabled={Object.keys(formState.dirtyFields).length === 0 || isToggling}
                  onClick={() => form.reset({ enable: false })}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={Object.keys(formState.dirtyFields).length === 0}
                  loading={isToggling}
                >
                  Save changes
                </Button>
              </div>
            </FormPanelFooter>
          </FormPanelContainer>
        </form>
      </Form_Shadcn_>
    </div>
  )
}
