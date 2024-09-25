import { zodResolver } from '@hookform/resolvers/zod'
import type { PostgresTrigger } from '@supabase/postgres-meta'
import { toString as CronToString } from 'cronstrue'
import { useRef, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import z from 'zod'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseCronjobCreateMutation } from 'data/database-cronjobs/database-cronjobs-create-mutation'
import { isValidHttpUrl } from 'lib/helpers'
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
  Switch,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { CRONJOB_DEFINITIONS } from './Cronjobs.constants'
import { buildCronQuery, buildHttpRequestCommand } from './Cronjobs.utils'
import { CronjobScheduleSection } from './CronjobScheduleSection'
import { EdgeFunctionSection } from './EdgeFunctionSection'
import { HTTPHeaderFieldsSection } from './HttpHeaderFieldsSection'
import { HTTPParameterFieldsSection } from './HttpParameterFieldsSection'
import { HttpRequestSection } from './HttpRequestSection'
import { SqlFunctionSection } from './SqlFunctionSection'
import { SqlSnippetSection } from './SqlSnippetSection'

export interface CreateCronjobSheetProps {
  visible: boolean
  selectedHook?: PostgresTrigger
  onClose: () => void
}

const edgeFunctionSchema = z.object({
  type: z.literal('edge_function'),
  method: z.enum(['GET', 'POST']),
  edgeFunctionName: z.string().trim().min(1),
  timeoutMs: z.number().default(1000),
  httpHeaders: z.array(z.object({ name: z.string(), value: z.string() })),
  httpParameters: z.array(z.object({ name: z.string(), value: z.string() })),
})

const httpRequestSchema = z.object({
  type: z.literal('http_request'),
  method: z.enum(['GET', 'POST']),
  endpoint: z.string().trim().min(1),
  timeoutMs: z.number().default(1000),
  httpHeaders: z.array(z.object({ name: z.string(), value: z.string() })),
  httpParameters: z.array(z.object({ name: z.string(), value: z.string() })),
})

const sqlFunctionSchema = z.object({
  type: z.literal('sql_function'),
  schema: z.string().trim().min(1),
  functionName: z.string().trim().min(1),
})
const sqlSnippetSchema = z.object({
  type: z.literal('sql_snippet'),
  snippet: z.string().trim().min(1),
})

const FormSchema = z.object({
  name: z.string().trim().min(1),
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
  active: z.boolean(),
  values: z.discriminatedUnion('type', [
    edgeFunctionSchema,
    httpRequestSchema,
    sqlFunctionSchema,
    sqlSnippetSchema,
  ]),
})

export type CreateCronJobForm = z.infer<typeof FormSchema>

const FORM_ID = 'create-cronjob-sidepanel'

export const CreateCronjobSheet = ({ onClose }: CreateCronjobSheetProps) => {
  const { ref } = useParams()
  const submitRef = useRef<any>(null)
  const [isClosingPanel, setIsClosingPanel] = useState(false)

  const { mutate, isLoading } = useDatabaseCronjobCreateMutation()

  const form = useForm<CreateCronJobForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      schedule: '',
      active: true,
      values: {
        type: 'edge_function',
        method: 'GET',
        edgeFunctionName: '',
        timeoutMs: 1000,
        httpHeaders: [],
        httpParameters: [],
      },
    },
  })

  const isEdited = form.formState.isDirty

  const { project } = useProjectContext()

  // useEffect(() => {
  //   if (visible) {
  //     setIsClosingPanel(false)

  //     // Reset form fields outside of the Form context
  //     if (selectedHook !== undefined) {
  //       setEvents(selectedHook.events)

  //       const [url, method, headers, parameters] = selectedHook.function_args
  //       const formattedHeaders = tryParseJson(headers) || {}
  //       setHttpHeaders(
  //         Object.keys(formattedHeaders).map((key) => {
  //           return { id: uuidv4(), name: key, value: formattedHeaders[key] }
  //         })
  //       )
  //       const formattedParameters = tryParseJson(parameters) || {}
  //       setHttpParameters(
  //         Object.keys(formattedParameters).map((key) => {
  //           return { id: uuidv4(), name: key, value: formattedParameters[key] }
  //         })
  //       )
  //     } else {
  //       setEvents([])
  //       setHttpHeaders([{ id: uuidv4(), name: 'Content-type', value: 'application/json' }])
  //       setHttpParameters([{ id: uuidv4(), name: '', value: '' }])
  //     }
  //   }
  // }, [visible, selectedHook])

  const onClosePanel = () => {
    if (isEdited) setIsClosingPanel(true)
    else onClose()
  }

  const validate = (values: any) => {
    const errors: any = {}

    if (!values.name) {
      errors['name'] = 'Please provide a name for your webhook'
    }
    if (!values.table_id) {
      errors['table_id'] = 'Please select a table for which your webhook will trigger from'
    }

    if (values.function_type === 'http_request') {
      // For HTTP requests
      if (!values.http_url) {
        errors['http_url'] = 'Please provide a URL'
      } else if (!values.http_url.startsWith('http')) {
        errors['http_url'] = 'Please include HTTP/HTTPs to your URL'
      } else if (!isValidHttpUrl(values.http_url)) {
        errors['http_url'] = 'Please provide a valid URL'
      }
    } else if (values.function_type === 'supabase_function') {
      // For Supabase Edge Functions
      if (values.http_url.includes('undefined')) {
        errors['http_url'] = 'No edge functions available for selection'
      }
    }

    if (values.timeout_ms < 1000 || values.timeout_ms > 5000) {
      errors['timeout_ms'] = 'Timeout should be between 1000ms and 5000ms'
    }

    return errors
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

    console.log(query)
    mutate({
      projectRef: project!.ref,
      connectionString: project?.connectionString,
      query,
    })
  }

  const cronType = form.watch('values.type')

  return (
    <>
      <div className="flex flex-col h-full">
        <SheetHeader>
          <SheetTitle>Create a new cronjob</SheetTitle>
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
                  name="active"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex"
                      label={`Active`}
                      description={'Is the cronjob active?'}
                    >
                      <FormControl_Shadcn_>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={field.disabled}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </SheetSection>
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
            Create cronjob
          </Button>
        </SheetFooter>
      </div>
      <ConfirmationModal
        visible={isClosingPanel}
        title="Discard changes"
        confirmLabel="Discard"
        onCancel={() => setIsClosingPanel(false)}
        onConfirm={() => {
          setIsClosingPanel(false)
          onClose()
        }}
      >
        <p className="text-sm text-foreground-light">
          There are unsaved changes. Are you sure you want to close the panel? Your changes will be
          lost.
        </p>
      </ConfirmationModal>
    </>
  )
}
