import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { toString as CronToString } from 'cronstrue'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useWatch } from '@ui/components/shadcn/ui/form'
import { urlRegex } from 'components/interfaces/Auth/Auth.constants'
import EnableExtensionModal from 'components/interfaces/Database/Extensions/EnableExtensionModal'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { getDatabaseCronJob } from 'data/database-cron-jobs/database-cron-job-query'
import { useDatabaseCronJobCreateMutation } from 'data/database-cron-jobs/database-cron-jobs-create-mutation'
import { CronJob } from 'data/database-cron-jobs/database-cron-jobs-infinite-query'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
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
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { CRONJOB_DEFINITIONS } from './CronJobs.constants'
import {
  buildCronQuery,
  buildHttpRequestCommand,
  cronPattern,
  parseCronJobCommand,
  secondsPattern,
} from './CronJobs.utils'
import { CronJobScheduleSection } from './CronJobScheduleSection'
import { EdgeFunctionSection } from './EdgeFunctionSection'
import { HttpBodyFieldSection } from './HttpBodyFieldSection'
import { HTTPHeaderFieldsSection } from './HttpHeaderFieldsSection'
import { HttpRequestSection } from './HttpRequestSection'
import { SqlFunctionSection } from './SqlFunctionSection'
import { SqlSnippetSection } from './SqlSnippetSection'

export interface CreateCronJobSheetProps {
  selectedCronJob?: Pick<CronJob, 'jobname' | 'schedule' | 'active' | 'command'>
  supportsSeconds: boolean
  isClosing: boolean
  setIsClosing: (v: boolean) => void
  onClose: () => void
}

const edgeFunctionSchema = z.object({
  type: z.literal('edge_function'),
  method: z.enum(['GET', 'POST']),
  edgeFunctionName: z.string().trim().min(1, 'Please select one of the listed Edge Functions'),
  timeoutMs: z.coerce.number().int().gte(1000).lte(5000).default(1000),
  httpHeaders: z.array(z.object({ name: z.string(), value: z.string() })),
  httpBody: z
    .string()
    .trim()
    .optional()
    .refine((value) => {
      if (!value) return true
      try {
        JSON.parse(value)
        return true
      } catch {
        return false
      }
    }, 'Input must be valid JSON'),
  // When editing a cron job, we want to keep the original command as a snippet in case the user wants to manually edit it
  snippet: z.string().trim(),
})

const httpRequestSchema = z.object({
  type: z.literal('http_request'),
  method: z.enum(['GET', 'POST']),
  endpoint: z
    .string()
    .trim()
    .min(1, 'Please provide a URL')
    .regex(urlRegex(), 'Please provide a valid URL')
    .refine((value) => value.startsWith('http'), 'Please include HTTP/HTTPs to your URL'),
  timeoutMs: z.coerce.number().int().gte(1000).lte(5000).default(1000),
  httpHeaders: z.array(z.object({ name: z.string(), value: z.string() })),
  httpBody: z
    .string()
    .trim()
    .optional()
    .refine((value) => {
      if (!value) return true
      try {
        JSON.parse(value)
        return true
      } catch {
        return false
      }
    }, 'Input must be valid JSON'),
  // When editing a cron job, we want to keep the original command as a snippet in case the user wants to manually edit it
  snippet: z.string().trim(),
})

const sqlFunctionSchema = z.object({
  type: z.literal('sql_function'),
  schema: z.string().trim().min(1, 'Please select one of the listed database schemas'),
  functionName: z.string().trim().min(1, 'Please select one of the listed database functions'),
  // When editing a cron job, we want to keep the original command as a snippet in case the user wants to manually edit it
  snippet: z.string().trim(),
})
const sqlSnippetSchema = z.object({
  type: z.literal('sql_snippet'),
  snippet: z.string().trim().min(1),
})

const FormSchema = z
  .object({
    name: z.string().trim().min(1, 'Please provide a name for your cron job'),
    supportsSeconds: z.boolean(),
    schedule: z
      .string()
      .trim()
      .min(1)
      .refine((value) => {
        if (cronPattern.test(value)) {
          try {
            CronToString(value)
            return true
          } catch {
            return false
          }
        } else if (secondsPattern.test(value)) {
          return true
        }
        return false
      }, 'Invalid Cron format'),
    values: z.discriminatedUnion('type', [
      edgeFunctionSchema,
      httpRequestSchema,
      sqlFunctionSchema,
      sqlSnippetSchema,
    ]),
  })
  .superRefine((data, ctx) => {
    if (!cronPattern.test(data.schedule)) {
      if (!(data.supportsSeconds && secondsPattern.test(data.schedule))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Seconds are supported only in pg_cron v1.5.0+. Please use a valid Cron format.',
          path: ['schedule'],
        })
      }
    }
  })

export type CreateCronJobForm = z.infer<typeof FormSchema>
export type CronJobType = CreateCronJobForm['values']

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
  isClosing,
  setIsClosing,
  onClose,
}: CreateCronJobSheetProps) => {
  const { project } = useProjectContext()
  const { data: org } = useSelectedOrganizationQuery()
  const [searchQuery] = useQueryState('search', parseAsString.withDefault(''))
  const [isLoadingGetCronJob, setIsLoadingGetCronJob] = useState(false)

  const isEditing = !!selectedCronJob?.jobname
  const [showEnableExtensionModal, setShowEnableExtensionModal] = useState(false)

  const { data } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const pgNetExtension = (data ?? []).find((ext) => ext.name === 'pg_net')
  const pgNetExtensionInstalled = pgNetExtension?.installed_version != undefined

  const { mutate: sendEvent } = useSendEventMutation()
  const { mutate: upsertCronJob, isLoading: isUpserting } = useDatabaseCronJobCreateMutation()
  const isLoading = isLoadingGetCronJob || isUpserting

  const canToggleExtensions = useCheckPermissions(
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

  const isEdited = form.formState.isDirty
  // if the form hasn't been touched and the user clicked esc or the backdrop, close the sheet
  if (!isEdited && isClosing) onClose()

  const onClosePanel = () => {
    if (isEdited) {
      setIsClosing(true)
    } else {
      onClose()
    }
  }

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
                        Enable <code className="text-xs w-min">pg_net</code> for HTTP requests or
                        Edge Functions
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
            onClick={onClosePanel}
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
      <ConfirmationModal
        visible={isClosing}
        title="Discard changes"
        confirmLabel="Discard"
        onCancel={() => setIsClosing(false)}
        onConfirm={() => onClose()}
      >
        <p className="text-sm text-foreground-light">
          There are unsaved changes. Are you sure you want to close the panel? Your changes will be
          lost.
        </p>
      </ConfirmationModal>
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
