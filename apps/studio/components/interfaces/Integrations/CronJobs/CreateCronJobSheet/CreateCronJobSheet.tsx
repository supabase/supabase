import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useWatch } from '@ui/components/shadcn/ui/form'
import { useParams } from 'common'
import { EnableExtensionModal } from 'components/interfaces/Database/Extensions/EnableExtensionModal'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { getDatabaseCronJob } from 'data/database-cron-jobs/database-cron-job-query'
import { useDatabaseCronJobCreateMutation } from 'data/database-cron-jobs/database-cron-jobs-create-mutation'
import { CronJob } from 'data/database-cron-jobs/database-cron-jobs-infinite-query'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Separator,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  WarningIcon,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { CRONJOB_DEFINITIONS } from '../CronJobs.constants'
import { buildCronQuery, buildHttpRequestCommand, parseCronJobCommand } from '../CronJobs.utils'
import { EdgeFunctionSection } from '../EdgeFunctionSection'
import { HttpBodyFieldSection } from '../HttpBodyFieldSection'
import { HTTPHeaderFieldsSection } from '../HttpHeaderFieldsSection'
import { HttpRequestSection } from '../HttpRequestSection'
import { SqlFunctionSection } from '../SqlFunctionSection'
import { SqlSnippetSection } from '../SqlSnippetSection'
import {
  type CreateCronJobForm,
  type CronJobType,
  FormSchema,
} from './CreateCronJobSheet.constants'
import { CronJobScheduleSection } from './CronJobScheduleSection'

interface CreateCronJobSheetProps {
  selectedCronJob?: Pick<CronJob, 'jobname' | 'schedule' | 'active' | 'command'>
  supportsSeconds: boolean
  onDirty: (isDirty: boolean) => void
  onClose: () => void
  onCloseWithConfirmation: () => void
}

const FORM_ID = 'create-cron-job-sidepanel'

const buildCommand = (values: CronJobType) => {
  let command = ''
  if (values.type === 'edge_function') {
    command = buildHttpRequestCommand(
      values.method,
      values.edgeFunctionName,
      values.httpHeaders,
      values.httpBody,
      values.timeoutMs
    )
  } else if (values.type === 'http_request') {
    command = buildHttpRequestCommand(
      values.method,
      values.endpoint,
      values.httpHeaders,
      values.httpBody,
      values.timeoutMs
    )
  } else if (values.type === 'sql_function') {
    command = `SELECT ${values.schema}.${values.functionName}()`
  }
  return command
}

export const CreateCronJobSheet = ({
  selectedCronJob,
  supportsSeconds,
  onDirty,
  onClose,
  onCloseWithConfirmation: confirmOnClose,
}: CreateCronJobSheetProps) => {
  const { childId } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const [searchQuery] = useQueryState('search', parseAsString.withDefault(''))
  const [isLoadingGetCronJob, setIsLoadingGetCronJob] = useState(false)

  const jobId = Number(childId)
  const isEditing = !!selectedCronJob?.jobname
  const [showEnableExtensionModal, setShowEnableExtensionModal] = useState(false)

  const { data } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const pgNetExtension = (data ?? []).find((ext) => ext.name === 'pg_net')
  const pgNetExtensionInstalled = pgNetExtension?.installed_version != undefined

  const { mutate: sendEvent } = useSendEventMutation()
  const { mutate: upsertCronJob, isPending: isUpserting } = useDatabaseCronJobCreateMutation()
  const isLoading = isLoadingGetCronJob || isUpserting

  const { can: canToggleExtensions } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'extensions'
  )

  const cronJobValues = parseCronJobCommand(selectedCronJob?.command || '', project?.ref!)

  const form = useForm<CreateCronJobForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: selectedCronJob?.jobname || '',
      schedule: selectedCronJob?.schedule || '*/5 * * * *',
      supportsSeconds,
      values: cronJobValues,
    },
  })

  useEffect(() => {
    const subscription = form.watch(() => {
      const isDirty = form.formState.isDirty
      onDirty(isDirty)
    })

    return () => subscription.unsubscribe()
  }, [form, onDirty])

  const [
    cronType,
    endpoint,
    edgeFunctionName,
    method,
    httpHeaders,
    httpBody,
    timeoutMs,
    schema,
    functionName,
  ] = useWatch({
    control: form.control,
    name: [
      'values.type',
      'values.endpoint',
      'values.edgeFunctionName',
      'values.method',
      'values.httpHeaders',
      'values.httpBody',
      'values.timeoutMs',
      'values.schema',
      'values.functionName',
    ],
  })

  // update the snippet field when the user changes the any values in the form
  useEffect(() => {
    const command = buildCommand({
      type: cronType,
      method,
      edgeFunctionName,
      timeoutMs,
      httpHeaders,
      httpBody,
      functionName,
      schema,
      endpoint,
      snippet: '',
    })
    if (command) {
      form.setValue('values.snippet', command)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    edgeFunctionName,
    endpoint,
    method,
    // for some reason, the httpHeaders are not memoized and cause the useEffect to trigger even when the value is the same
    JSON.stringify(httpHeaders),
    httpBody,
    timeoutMs,
    schema,
    functionName,
    form,
  ])

  const onSubmit: SubmitHandler<CreateCronJobForm> = async ({ name, schedule, values }) => {
    if (!project) return console.error('Project is required')

    if (!isEditing) {
      try {
        setIsLoadingGetCronJob(true)
        const checkExistingJob = await getDatabaseCronJob({
          projectRef: project.ref,
          connectionString: project.connectionString,
          name,
        })
        const nameExists = !!checkExistingJob

        if (nameExists) {
          return form.setError('name', {
            type: 'manual',
            message: 'A cron job with this name already exists',
          })
        }
      } catch (error: any) {
        toast.error(`Failed to validate cron job name: ${error.message}`)
      } finally {
        setIsLoadingGetCronJob(false)
      }
    }

    const command = `$$${values.snippet}$$`
    const query = buildCronQuery(name, schedule, command)

    upsertCronJob(
      {
        projectRef: project!.ref,
        connectionString: project?.connectionString,
        query,
        searchTerm: searchQuery,
        // [Joshen] Only need to invalidate a specific cron job if in the job's previous run tab
        identifier: !!jobId ? jobId : undefined,
      },
      {
        onSuccess: () => {
          if (isEditing) {
            toast.success(`Successfully updated cron job ${name}`)
          } else {
            toast.success(`Successfully created cron job ${name}`)
          }

          if (isEditing) {
            sendEvent({
              action: 'cron_job_updated',
              properties: {
                type: values.type,
                schedule: schedule,
              },
              groups: {
                project: project?.ref ?? 'Unknown',
                organization: org?.slug ?? 'Unknown',
              },
            })
          } else {
            sendEvent({
              action: 'cron_job_created',
              properties: {
                type: values.type,
                schedule: schedule,
              },
              groups: {
                project: project?.ref ?? 'Unknown',
                organization: org?.slug ?? 'Unknown',
              },
            })
          }

          onClose()
        },
      }
    )
    setIsLoadingGetCronJob(false)
  }

  return (
    <>
      <div className="flex flex-col h-full" tabIndex={-1}>
        <SheetHeader>
          <SheetTitle>
            {isEditing ? `Edit ${selectedCronJob.jobname}` : `Create a new cron job`}
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-auto flex-grow">
          <Form_Shadcn_ {...form}>
            <form
              id={FORM_ID}
              className="flex-grow overflow-auto"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <SheetSection>
                <FormField_Shadcn_
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItemLayout label="Name" layout="vertical" className="gap-1 relative">
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ {...field} disabled={isEditing} />
                      </FormControl_Shadcn_>
                      <span className="text-foreground-lighter text-xs absolute top-0 right-0">
                        Cron jobs cannot be renamed once created
                      </span>
                    </FormItemLayout>
                  )}
                />
              </SheetSection>
              <Separator />
              <CronJobScheduleSection form={form} supportsSeconds={supportsSeconds} />
              <Separator />
              <SheetSection>
                <FormField_Shadcn_
                  control={form.control}
                  name="values.type"
                  render={({ field }) => (
                    <FormItemLayout label="Type" layout="vertical" className="gap-1">
                      <FormControl_Shadcn_>
                        <RadioGroupStacked
                          id="function_type"
                          name="function_type"
                          value={field.value}
                          disabled={field.disabled}
                          onValueChange={(value) => field.onChange(value)}
                        >
                          {CRONJOB_DEFINITIONS.map((definition) => (
                            <RadioGroupStackedItem
                              key={definition.value}
                              id={definition.value}
                              value={definition.value}
                              disabled={
                                !pgNetExtensionInstalled &&
                                (definition.value === 'http_request' ||
                                  definition.value === 'edge_function')
                              }
                              label=""
                              showIndicator={false}
                            >
                              <div className="flex items-center gap-x-5">
                                <div className="text-foreground">{definition.icon}</div>
                                <div className="flex flex-col">
                                  <div className="flex gap-x-2">
                                    <p className="text-foreground">{definition.label}</p>
                                  </div>
                                  <p className="text-foreground-light">{definition.description}</p>
                                </div>
                              </div>
                              {!pgNetExtensionInstalled &&
                              (definition.value === 'http_request' ||
                                definition.value === 'edge_function') ? (
                                <div className="w-full flex gap-x-2 pl-11 py-2 items-center">
                                  <WarningIcon />
                                  <span className="text-xs">
                                    <code>pg_net</code> needs to be installed to use this type
                                  </span>
                                </div>
                              ) : null}
                            </RadioGroupStackedItem>
                          ))}
                        </RadioGroupStacked>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
                {!pgNetExtensionInstalled && (
                  <Admonition
                    type="note"
                    // @ts-ignore
                    title={
                      <span>
                        Enable <code className="text-code-inline w-min">pg_net</code> for HTTP
                        requests or Edge Functions
                      </span>
                    }
                    description={
                      <div className="flex flex-col gap-y-2">
                        <span>
                          This will allow you to send HTTP requests or trigger an edge function
                          within your cron jobs
                        </span>
                        <ButtonTooltip
                          type="default"
                          className="w-min"
                          disabled={!canToggleExtensions}
                          onClick={() => setShowEnableExtensionModal(true)}
                          tooltip={{
                            content: {
                              side: 'bottom',
                              text: !canToggleExtensions
                                ? 'You need additional permissions to enable database extensions'
                                : undefined,
                            },
                          }}
                        >
                          Install pg_net extension
                        </ButtonTooltip>
                      </div>
                    }
                  />
                )}
              </SheetSection>
              <Separator />
              {cronType === 'http_request' && (
                <>
                  <HttpRequestSection form={form} />
                  <Separator />
                  <HTTPHeaderFieldsSection variant={cronType} />
                  <Separator />
                  <HttpBodyFieldSection form={form} />
                </>
              )}
              {cronType === 'edge_function' && (
                <>
                  <EdgeFunctionSection form={form} />
                  <Separator />
                  <HTTPHeaderFieldsSection variant={cronType} />
                  <Separator />
                  <HttpBodyFieldSection form={form} />
                </>
              )}
              {cronType === 'sql_function' && <SqlFunctionSection form={form} />}
              {cronType === 'sql_snippet' && <SqlSnippetSection form={form} />}
            </form>
          </Form_Shadcn_>
        </div>
        <SheetFooter>
          <Button
            size="tiny"
            type="default"
            htmlType="button"
            onClick={confirmOnClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            size="tiny"
            type="primary"
            form={FORM_ID}
            htmlType="submit"
            disabled={isLoading}
            loading={isLoading}
          >
            {isEditing ? `Save cron job` : 'Create cron job'}
          </Button>
        </SheetFooter>
      </div>
      {pgNetExtension && (
        <EnableExtensionModal
          visible={showEnableExtensionModal}
          extension={pgNetExtension}
          onCancel={() => setShowEnableExtensionModal(false)}
        />
      )}
    </>
  )
}
