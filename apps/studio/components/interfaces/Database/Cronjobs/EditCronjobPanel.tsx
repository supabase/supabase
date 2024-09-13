import { zodResolver } from '@hookform/resolvers/zod'
import type { PostgresTrigger } from '@supabase/postgres-meta'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseTriggerCreateMutation } from 'data/database-triggers/database-trigger-create-mutation'
import { useDatabaseTriggerUpdateMutation } from 'data/database-triggers/database-trigger-update-transaction-mutation'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { getTable } from 'data/tables/table-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { isValidHttpUrl, tryParseJson } from 'lib/helpers'
import uuidv4 from 'lib/uuid'
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
import { CRONJOB_DEFINITIONS, CRONJOB_TYPES } from './Cronjobs.constants'
import { EdgeFunctionSection } from './EdgeFunctionSection'
import { HTTPHeaderFieldsSection } from './HttpHeaderFieldsSection'
import { HTTPParameterFieldsSection } from './HttpParameterFieldsSection'
import { HttpRequestSection } from './HttpRequestSection'
import { SqlFunctionSection } from './SqlFunctionSection'
import { SqlSnippetSection } from './SqlSnippetSection'

export interface EditCronjobPanelProps {
  visible: boolean
  selectedHook?: PostgresTrigger
  onClose: () => void
}

const FormSchema = z.object({
  name: z.string().trim().min(1),
  schedule: z.string().trim().min(1),
  active: z.boolean(),
  type: z.enum(CRONJOB_TYPES),
  httpRequestValues: z.object({
    method: z.enum(['GET', 'POST']),
    endpoint: z.string().trim().min(1),
    timeoutMs: z.number().default(1000),
    httpHeaders: z.array(z.object({ name: z.string(), value: z.string() })),
    httpParameters: z.array(z.object({ name: z.string(), value: z.string() })),
  }),
  edgeFunctionValues: z.object({
    method: z.enum(['GET', 'POST']),
    edgeFunctionName: z.string().trim().min(1),
    timeoutMs: z.number().default(1000),
    httpHeaders: z.array(z.object({ name: z.string(), value: z.string() })),
    httpParameters: z.array(z.object({ name: z.string(), value: z.string() })),
  }),
  sqlFunctionValues: z.object({
    schema: z.string().trim().min(1),
    functionName: z.string().trim().min(1),
  }),
  sqlSnippetValues: z.object({
    snippet: z.string().trim().min(1),
  }),
})

export type CreateCronJobForm = z.infer<typeof FormSchema>

export type HTTPArgument = { id: string; name: string; value: string }

const FORM_ID = 'create-cronjob-sidepanel'

export const EditCronjobPanel = ({ visible, selectedHook, onClose }: EditCronjobPanelProps) => {
  const { ref } = useParams()
  const submitRef = useRef<any>(null)
  const [isClosingPanel, setIsClosingPanel] = useState(false)

  // [Joshen] There seems to be some bug between Checkbox.Group within the Form component
  // hence why this external state as a temporary workaround
  const [events, setEvents] = useState<string[]>([])
  const [eventsError, setEventsError] = useState<string>()

  // For HTTP request
  const [httpHeaders, setHttpHeaders] = useState<HTTPArgument[]>([])
  const [httpParameters, setHttpParameters] = useState<HTTPArgument[]>([])

  const form = useForm<CreateCronJobForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      schedule: '',
      active: true,
      type: 'edge_function',
      httpRequestValues: {
        method: 'GET',
        endpoint: '',
        timeoutMs: 1000,
        httpHeaders: [],
        httpParameters: [],
      },
      edgeFunctionValues: {
        method: 'GET',
        edgeFunctionName: '',
        timeoutMs: 1000,
        httpHeaders: [],
        httpParameters: [],
      },
      sqlFunctionValues: {
        schema: '',
        functionName: '',
      },
      sqlSnippetValues: {
        snippet: '',
      },
    },
  })

  const isEdited = form.formState.isDirty

  const { project } = useProjectContext()
  const { data } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: functions } = useEdgeFunctionsQuery({ projectRef: ref })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { mutate: createDatabaseTrigger } = useDatabaseTriggerCreateMutation({
    onSuccess: (res) => {
      toast.success(`Successfully created new webhook "${res.name}"`)
      setIsSubmitting(false)
      onClose()
    },
    onError: (error) => {
      setIsSubmitting(false)
      toast.error(`Failed to create webhook: ${error.message}`)
    },
  })
  const { mutate: updateDatabaseTrigger } = useDatabaseTriggerUpdateMutation({
    onSuccess: (res) => {
      setIsSubmitting(false)
      toast.success(`Successfully updated webhook "${res.name}"`)
      onClose()
    },
    onError: (error) => {
      setIsSubmitting(false)
      toast.error(`Failed to update webhook: ${error.message}`)
    },
  })

  const tables = useMemo(
    () => [...(data ?? [])].sort((a, b) => (a.schema > b.schema ? 0 : -1)),
    [data]
  )
  const restUrl = project?.restUrl
  const restUrlTld = restUrl ? new URL(restUrl).hostname.split('.').pop() : 'co'

  const isEdgeFunction = (url: string) =>
    url.includes(`https://${ref}.functions.supabase.${restUrlTld}/`) ||
    url.includes(`https://${ref}.supabase.${restUrlTld}/functions/`)

  const initialValues = {
    name: selectedHook?.name ?? '',
    table_id: selectedHook?.table_id ?? '',
    http_url: selectedHook?.function_args?.[0] ?? '',
    http_method: selectedHook?.function_args?.[1] ?? 'POST',
    function_type: isEdgeFunction(selectedHook?.function_args?.[0] ?? '')
      ? 'supabase_function'
      : 'http_request',
    timeout_ms: Number(selectedHook?.function_args?.[4] ?? 1000),
  }

  useEffect(() => {
    if (visible) {
      setIsClosingPanel(false)

      // Reset form fields outside of the Form context
      if (selectedHook !== undefined) {
        setEvents(selectedHook.events)

        const [url, method, headers, parameters] = selectedHook.function_args
        const formattedHeaders = tryParseJson(headers) || {}
        setHttpHeaders(
          Object.keys(formattedHeaders).map((key) => {
            return { id: uuidv4(), name: key, value: formattedHeaders[key] }
          })
        )
        const formattedParameters = tryParseJson(parameters) || {}
        setHttpParameters(
          Object.keys(formattedParameters).map((key) => {
            return { id: uuidv4(), name: key, value: formattedParameters[key] }
          })
        )
      } else {
        setEvents([])
        setHttpHeaders([{ id: uuidv4(), name: 'Content-type', value: 'application/json' }])
        setHttpParameters([{ id: uuidv4(), name: '', value: '' }])
      }
    }
  }, [visible, selectedHook])

  const onClosePanel = () => {
    if (isEdited) setIsClosingPanel(true)
    else onClose()
  }

  const onUpdateSelectedEvents = (event: string) => {
    if (events.includes(event)) {
      setEvents(events.filter((e) => e !== event))
    } else {
      setEvents(events.concat(event))
    }
    setEventsError(undefined)
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

  const onSubmit = async (values: any) => {
    setIsSubmitting(true)
    if (!project?.ref) {
      return console.error('Project ref is required')
    }
    if (events.length === 0) {
      return setEventsError('Please select at least one event')
    }

    const selectedTable = await getTable({
      id: values.table_id,
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    })
    if (!selectedTable) {
      setIsSubmitting(false)
      return toast.error('Unable to find selected table')
    }

    const headers = httpHeaders
      .filter((header) => header.name && header.value)
      .reduce((a: any, b: any) => {
        a[b.name] = b.value
        return a
      }, {})
    const parameters = httpParameters
      .filter((param) => param.name && param.value)
      .reduce((a: any, b: any) => {
        a[b.name] = b.value
        return a
      }, {})

    const payload: any = {
      events,
      activation: 'AFTER',
      orientation: 'ROW',
      enabled_mode: 'ORIGIN',
      name: values.name,
      table: selectedTable.name,
      schema: selectedTable.schema,
      table_id: values.table_id,
      function_name: 'http_request',
      function_schema: 'supabase_functions',
      function_args: [
        values.http_url,
        values.http_method,
        JSON.stringify(headers),
        JSON.stringify(parameters),
        values.timeout_ms.toString(),
      ],
    }

    if (selectedHook === undefined) {
      createDatabaseTrigger({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        payload,
      })
    } else {
      updateDatabaseTrigger({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        originalTrigger: selectedHook,
        updatedTrigger: payload,
      })
    }
  }

  const cronType = form.watch('type')

  return (
    <>
      <div className="flex flex-col h-full">
        <SheetHeader>
          <SheetTitle>
            {selectedHook === undefined ? (
              'Create a new database webhook'
            ) : (
              <>
                Update webhook <code className="text-sm">{selectedHook?.name}</code>
              </>
            )}
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
              <SheetSection>
                <FormField_Shadcn_
                  control={form.control}
                  name="schedule"
                  render={({ field }) => (
                    <FormItemLayout
                      label="Cron schedule"
                      layout="vertical"
                      className="gap-1"
                      labelOptional="Should be in this format * * * * *"
                    >
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ {...field} />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </SheetSection>
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
                  name="type"
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
                  <HTTPHeaderFieldsSection fieldName="httpRequestValues.httpHeaders" />
                  <Separator />
                  <HTTPParameterFieldsSection fieldName="httpRequestValues.httpParameters" />
                </>
              )}
              {cronType === 'edge_function' && (
                <>
                  <EdgeFunctionSection form={form} />
                  <Separator />
                  <HTTPHeaderFieldsSection fieldName="edgeFunctionValues.httpHeaders" />
                  <Separator />
                  <HTTPParameterFieldsSection fieldName="edgeFunctionValues.httpParameters" />
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
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            size="tiny"
            type="primary"
            htmlType="button"
            disabled={isSubmitting}
            loading={isSubmitting}
            onClick={() => submitRef?.current?.click()}
          >
            {selectedHook === undefined ? 'Create webhook' : 'Update webhook'}
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
          setIsEdited(false)
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
