import { zodResolver } from '@hookform/resolvers/zod'
import { toString as CronToString } from 'cronstrue'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { urlRegex } from 'components/interfaces/Auth/Auth.constants'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useDatabaseCronJobCreateMutation } from 'data/database-cron-jobs/database-cron-jobs-create-mutation'
import { CronJob } from 'data/database-cron-jobs/database-cron-jobs-query'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useState } from 'react'
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
import { Admonition } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import EnableExtensionModal from 'components/interfaces/Database/Extensions/EnableExtensionModal'
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
  httpBody: z.string().trim(),
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
  httpBody: z.string().trim(),
})

const sqlFunctionSchema = z.object({
  type: z.literal('sql_function'),
  schema: z.string().trim().min(1, 'Please select one of the listed database schemas'),
  functionName: z.string().trim().min(1, 'Please select one of the listed database functions'),
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

export const CreateCronJobSheet = ({
  selectedCronJob,
  supportsSeconds,
  isClosing,
  setIsClosing,
  onClose,
}: CreateCronJobSheetProps) => {
  const { project } = useProjectContext()
  const isEditing = !!selectedCronJob?.jobname

  const [showEnableExtensionModal, setShowEnableExtensionModal] = useState(false)
  const { mutate: upsertCronJob, isLoading } = useDatabaseCronJobCreateMutation()

  const canToggleExtensions = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'extensions'
  )

  const cronJobValues = parseCronJobCommand(selectedCronJob?.command || '')

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
  if (!isEdited && isClosing) {
    onClose()
  }

  const onClosePanel = () => {
    if (isEdited) {
      setIsClosing(true)
    } else {
      onClose()
    }
  }

  const onSubmit: SubmitHandler<CreateCronJobForm> = async ({ name, schedule, values }) => {
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
      command = `'CALL ${values.schema}.${values.functionName}()'`
    } else {
      command = `$$${values.snippet}$$`
    }

    const query = buildCronQuery(name, schedule, command)

    upsertCronJob(
      {
        projectRef: project!.ref,
        connectionString: project?.connectionString,
        query,
      },
      {
        onSuccess: () => {
          if (isEditing) {
            toast.success(`Successfully updated cron job ${name}`)
          } else {
            toast.success(`Successfully created cron job ${name}`)
          }
          onClose()
        },
      }
    )
  }

  const { data } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const pgNetExtension = (data ?? []).find((ext) => ext.name === 'pg_net')
  const pgNetExtensionInstalled = pgNetExtension?.installed_version != undefined

  const cronType = form.watch('values.type')

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
                          onValueChange={field.onChange}
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
