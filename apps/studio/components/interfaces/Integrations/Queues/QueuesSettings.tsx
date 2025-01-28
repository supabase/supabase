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
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { useProjectPostgrestConfigUpdateMutation } from 'data/config/project-postgrest-config-update-mutation'
import { useQueuesExposePostgrestStatusQuery } from 'data/database-queues/database-queues-expose-postgrest-status-query'
import {
  QUEUES_SCHEMA,
  useDatabaseQueueToggleExposeMutation,
} from 'data/database-queues/database-queues-toggle-postgrest-mutation'
import { useTableUpdateMutation } from 'data/tables/table-update-mutation'
import { useTablesQuery } from 'data/tables/tables-query'
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
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

// [Joshen] Not convinced with the UI and layout but getting the functionality out first

export const QueuesSettings = () => {
  const project = useSelectedProject()
  const canUpdatePostgrestConfig = useCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_postgrest'
  )
  const [isToggling, setIsToggling] = useState(false)
  const [rlsConfirmModalOpen, setRlsConfirmModalOpen] = useState(false)
  const [isUpdatingRls, setIsUpdatingRls] = useState(false)

  const formSchema = z.object({ enable: z.boolean() })
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: { enable: false },
  })
  const { formState } = form
  const { enable } = form.watch()

  const { data: queueTables } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: 'pgmq',
  })
  const tablesWithoutRLS =
    queueTables?.filter((x) => x.name.startsWith('q_') && !x.rls_enabled) ?? []

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

  const { mutateAsync: updateTable } = useTableUpdateMutation()

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

  const onToggleRLS = async () => {
    if (!project) return console.error('Project is required')
    setIsUpdatingRls(true)
    try {
      await Promise.all(
        tablesWithoutRLS.map((x) =>
          updateTable({
            projectRef: project?.ref,
            connectionString: project?.connectionString,
            id: x.id,
            schema: x.schema,
            payload: { id: x.id, rls_enabled: true },
          })
        )
      )
      toast.success(
        `Successfully enabled RLS on ${tablesWithoutRLS.length === 1 ? tablesWithoutRLS[0].name : `${tablesWithoutRLS.length} queue${tablesWithoutRLS.length > 1 ? 's' : ''}`} `
      )
      setRlsConfirmModalOpen(false)
    } catch (error: any) {
      setIsUpdatingRls(false)
      toast.error(`Failed to enable RLS on queues: ${error.message}`)
    }
  }

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
    <>
      <div className="w-full flex flex-col gap-y-4 p-10">
        <FormHeader
          className="mb-0"
          title="Settings"
          description="Manage your queues via any client library or Data APIs endpoints"
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
                        label="Expose Queues via PostgREST"
                        description={
                          <>
                            <p className="max-w-2xl">
                              When enabled, you will be able to use the following functions from the{' '}
                              <code className="text-xs">{QUEUES_SCHEMA}</code> schema to manage your
                              queues via any Supabase client library or PostgREST endpoints:
                            </p>
                            <p className="mt-2">
                              <code className="text-xs">send</code>,{' '}
                              <code className="text-xs">send_batch</code>,{' '}
                              <code className="text-xs">read</code>,{' '}
                              <code className="text-xs">pop</code>,
                              <code className="text-xs">archive</code>, and
                              <code className="text-xs">delete</code>
                            </p>
                          </>
                        }
                      >
                        <FormControl_Shadcn_>
                          <Switch
                            name="enable"
                            size="large"
                            disabled={
                              isLoading || tablesWithoutRLS.length > 0 || !canUpdatePostgrestConfig
                            }
                            checked={field.value}
                            onCheckedChange={(value) => field.onChange(value)}
                          />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                      {tablesWithoutRLS.length > 0 && (
                        <Admonition
                          type="default"
                          title="Existing Queues must have RLS enabled first before exposing via PostgREST"
                          className="mt-2"
                        >
                          <p className="!m-0">
                            Please ensure that the following {tablesWithoutRLS.length} queue
                            {tablesWithoutRLS.length > 1 ? 's' : ''} have RLS enabled in order to
                            prevent anonymous access.
                          </p>
                          <ul className="list-disc pl-6">
                            {tablesWithoutRLS.map((x) => {
                              return (
                                <li key={x.name}>
                                  <code className="text-xs">{x.name.slice(2)}</code>
                                </li>
                              )
                            })}
                          </ul>

                          <Button
                            type="default"
                            className="mt-3"
                            onClick={() => setRlsConfirmModalOpen(true)}
                          >
                            Enable RLS on{' '}
                            {tablesWithoutRLS.length === 1
                              ? tablesWithoutRLS[0].name.slice(2)
                              : `${tablesWithoutRLS.length} queues`}
                          </Button>
                        </Admonition>
                      )}
                      {formState.dirtyFields.enable && field.value === true && (
                        <Admonition type="warning" className="mt-2">
                          <p>
                            Queues will be exposed and managed through the{' '}
                            <code className="text-xs">{QUEUES_SCHEMA}</code> schema
                          </p>
                          <p className="text-foreground-light">
                            Database functions will be created in the{' '}
                            <code className="text-xs">{QUEUES_SCHEMA}</code> schema upon enabling.
                            Call these functions via any Supabase client library or PostgREST
                            endpoint to manage your queues. Permissions on individual queues can
                            also be further managed through privileges and row level security (RLS).
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
                <DocsButton href="https://github.com/tembo-io/pgmq?tab=readme-ov-file#sql-examples" />
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

      <ConfirmationModal
        visible={rlsConfirmModalOpen}
        title="Confirm to enable Row Level Security"
        confirmLabel="Enable RLS"
        confirmLabelLoading="Enabling RLS"
        loading={isUpdatingRls}
        onCancel={() => setRlsConfirmModalOpen(false)}
        onConfirm={() => onToggleRLS()}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to enable Row Level Security for the following queues:
        </p>
        <ul className="list-disc pl-6">
          {tablesWithoutRLS.map((x) => {
            return (
              <li key={x.id}>
                <code className="text-xs">{x.name.slice(2)}</code>
              </li>
            )
          })}
        </ul>
      </ConfirmationModal>
    </>
  )
}
