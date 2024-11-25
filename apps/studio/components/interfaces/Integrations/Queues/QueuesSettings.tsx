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
    <div className="w-full flex flex-col gap-y-4">
      <FormHeader
        className="mb-0"
        title="Settings"
        description="Manage your queues via any client library or PostgREST endpoints"
        docsUrl="https://supabase.com/docs"
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
                      description="When enabled, you will be able to use any Supabase client library and PostgREST endpoints to manage your queues"
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
                      <Admonition
                        type="default"
                        className="mt-2"
                        title="Database functions for managing queues will be created upon enabling"
                        description={
                          <>
                            <p>
                              These functions include <code className="text-xs">send</code>,{' '}
                              <code className="text-xs">send_batch</code>,{' '}
                              <code className="text-xs">read</code>,{' '}
                              <code className="text-xs">pop</code>,
                              <code className="text-xs">archive</code>, and
                              <code className="text-xs">delete</code>, and they will be created in a{' '}
                              <code className="text-xs">queues_public</code> schema, where you can
                              then call through any Supabase client library or PostgREST endpoint
                            </p>
                            <DocsButton
                              abbrev={false}
                              className="mt-2"
                              href="https://supabase.com/docs"
                            />
                          </>
                        }
                      />
                    )}
                    {formState.dirtyFields.enable && field.value === false && (
                      <Admonition
                        type="warning"
                        className="mt-2"
                        title="Database functions for managing queues will be removed upon disabling"
                        description={
                          <>
                            <p>
                              These functions include <code className="text-xs">send</code>,{' '}
                              <code className="text-xs">send_batch</code>,{' '}
                              <code className="text-xs">read</code>,{' '}
                              <code className="text-xs">pop</code>,
                              <code className="text-xs">archive</code>, and
                              <code className="text-xs">delete</code>, and they will be removed from
                              the <code className="text-xs">queues_public</code> schema, which will
                              subsequently be dropped too. Ensure that these functions are not in
                              use within your client applications before disabling.
                            </p>
                            <DocsButton
                              abbrev={false}
                              className="mt-2"
                              href="https://supabase.com/docs"
                            />
                          </>
                        }
                      />
                    )}
                  </FormItem_Shadcn_>
                )}
              />
            </FormPanelContent>
            <FormPanelFooter className="flex px-8 py-4 flex items-center justify-end gap-x-2">
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
            </FormPanelFooter>
          </FormPanelContainer>
        </form>
      </Form_Shadcn_>
    </div>
  )
}
