import { zodResolver } from '@hookform/resolvers/zod'
import { toString as CronToString } from 'cronstrue'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { urlRegex } from 'components/interfaces/Auth/Auth.constants'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseCronjobCreateMutation } from 'data/database-cronjobs/database-cronjobs-create-mutation'
import { Cronjob } from 'data/database-cronjobs/database-cronjobs-query'
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
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { CRONJOB_DEFINITIONS } from './Cronjobs.constants'
import { buildCronQuery, buildHttpRequestCommand, parseCronjobCommand } from './Cronjobs.utils'
import { CronjobScheduleSection } from './CronjobScheduleSection'
import { EdgeFunctionSection } from './EdgeFunctionSection'
import { HTTPHeaderFieldsSection } from './HttpHeaderFieldsSection'
import { HTTPParameterFieldsSection } from './HttpParameterFieldsSection'
import { HttpRequestSection } from './HttpRequestSection'
import { SqlFunctionSection } from './SqlFunctionSection'
import { SqlSnippetSection } from './SqlSnippetSection'

export interface CreateCronjobSheetProps {
  selectedCronjob?: Pick<Cronjob, 'jobname' | 'schedule' | 'active' | 'command'>
  isClosing: boolean
  setIsClosing: (v: boolean) => void
  onClose: () => void
}

const edgeFunctionSchema = z.object({
  type: z.literal('edge_function'),
  method: z.enum(['GET', 'POST']),
  edgeFunctionName: z.string().trim().min(1, 'Please select one of the listed Edge Functions'),
  timeoutMs: z.number().default(1000),
  httpHeaders: z.array(z.object({ name: z.string(), value: z.string() })),
  httpParameters: z.array(z.object({ name: z.string(), value: z.string() })),
})

const httpRequestSchema = z.object({
  type: z.literal('http_request'),
  method: z.enum(['GET', 'POST']),
  endpoint: z
    .string()
    .trim()
    .min(1, 'Please provide a URL')
    .regex(urlRegex, 'Please provide a valid URL')
    .refine((value) => value.startsWith('http'), 'Please include HTTP/HTTPs to your URL'),
  timeoutMs: z.number().default(1000),
  httpHeaders: z.array(z.object({ name: z.string(), value: z.string() })),
  httpParameters: z.array(z.object({ name: z.string(), value: z.string() })),
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

const FormSchema = z.object({
  name: z.string().trim().min(1, 'Please provide a name for your cronjob'),
  schedule: z
    .string()
    .trim()
    .min(1)
    .refine((value) => {
      try {
        CronToString(value)
      } catch {
        return false
      }
      return true
    }, 'The schedule needs to be in a Cron format.'),
  values: z.discriminatedUnion('type', [
    edgeFunctionSchema,
    httpRequestSchema,
    sqlFunctionSchema,
    sqlSnippetSchema,
  ]),
})

export type CreateCronJobForm = z.infer<typeof FormSchema>
export type CronjobType = CreateCronJobForm['values']

const FORM_ID = 'create-cronjob-sidepanel'

export const CreateCronjobSheet = ({
  selectedCronjob,
  isClosing,
  setIsClosing,
  onClose,
}: CreateCronjobSheetProps) => {
  const isEditing = !!selectedCronjob
  const { mutate: upsertCronjob, isLoading } = useDatabaseCronjobCreateMutation()

  const cronjobValues = parseCronjobCommand(selectedCronjob?.command || '')

  const form = useForm<CreateCronJobForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: selectedCronjob?.jobname || '',
      schedule: selectedCronjob?.schedule || '',
      values: cronjobValues,
    },
  })

  const { project } = useProjectContext()
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
        values.httpParameters,
        values.timeoutMs
      )
    } else if (values.type === 'http_request') {
      command = buildHttpRequestCommand(
        values.method,
        values.endpoint,
        values.httpHeaders,
        values.httpParameters,
        values.timeoutMs
      )
    } else if (values.type === 'sql_function') {
      command = `CALL ${values.schema}.${values.functionName}()`
    } else {
      command = `$$${values.snippet}$$`
    }

    const query = buildCronQuery(name, schedule, command)

    upsertCronjob(
      {
        projectRef: project!.ref,
        connectionString: project?.connectionString,
        query,
      },
      {
        onSuccess: () => {
          if (isEditing) {
            toast.success(`Successfully updated cronjob ${name}`)
          } else {
            toast.success(`Successfully created cronjob ${name}`)
          }
          onClose()
        },
      }
    )
  }

  const cronType = form.watch('values.type')

  return (
    <>
      <div className="flex flex-col h-full" tabIndex={-1}>
        <SheetHeader>
          <SheetTitle>
            {isEditing ? `Edit ${selectedCronjob.jobname}` : `Create a new cronjob`}
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
                    <FormItemLayout label="Name of cronjob" layout="vertical" className="gap-1">
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ {...field} />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </SheetSection>
              <Separator />
              <CronjobScheduleSection form={form} />
              <Separator />
              <SheetSection>
                <FormField_Shadcn_
                  control={form.control}
                  name="values.type"
                  render={({ field }) => (
                    <FormItemLayout label="Type of cron job" layout="vertical" className="gap-1">
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
                              label=""
                              showIndicator={false}
                            >
                              <div className="flex items-center space-x-5">
                                <div className="text-foreground">{definition.icon}</div>
                                <div className="flex-col space-y-0">
                                  <div className="flex space-x-2">
                                    <p className="text-foreground">{definition.label}</p>
                                  </div>
                                  <p className="text-foreground-light">{definition.description}</p>
                                </div>
                              </div>
                            </RadioGroupStackedItem>
                          ))}
                        </RadioGroupStacked>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </SheetSection>
              <Separator />
              {cronType === 'http_request' && (
                <>
                  <HttpRequestSection form={form} />
                  <Separator />
                  <HTTPHeaderFieldsSection fieldName="values.httpHeaders" />
                  <Separator />
                  <HTTPParameterFieldsSection fieldName="values.httpParameters" />
                </>
              )}
              {cronType === 'edge_function' && (
                <>
                  <EdgeFunctionSection form={form} />
                  <Separator />
                  <HTTPHeaderFieldsSection fieldName="values.httpHeaders" />
                  <Separator />
                  <HTTPParameterFieldsSection fieldName="values.httpParameters" />
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
            {isEditing ? `Save cronjob` : 'Create cronjob'}
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
    </>
  )
}
