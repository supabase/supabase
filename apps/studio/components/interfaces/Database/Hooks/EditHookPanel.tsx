import { PGTriggerCreate } from '@supabase/pg-meta/src/pg-meta-triggers'
import type { PostgresTrigger } from '@supabase/postgres-meta'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseTriggerCreateMutation } from 'data/database-triggers/database-trigger-create-mutation'
import { useDatabaseTriggerUpdateMutation } from 'data/database-triggers/database-trigger-update-transaction-mutation'
import { getTableEditor } from 'data/table-editor/table-editor-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { isValidHttpUrl, uuidv4 } from 'lib/helpers'
import { Button, Form, SidePanel } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormContents } from './FormContents'

export interface EditHookPanelProps {
  visible: boolean
  selectedHook?: PostgresTrigger
  onClose: () => void
}

export type HTTPArgument = { id: string; name: string; value: string }

export const isEdgeFunction = ({
  ref,
  restUrlTld,
  url,
}: {
  ref?: string
  restUrlTld?: string
  url: string
}) =>
  url.includes(`https://${ref}.functions.supabase.${restUrlTld}/`) ||
  url.includes(`https://${ref}.supabase.${restUrlTld}/functions/`)

export const EditHookPanel = ({ visible, selectedHook, onClose }: EditHookPanelProps) => {
  const { ref } = useParams()
  const submitRef = useRef<any>(null)
  const [isEdited, setIsEdited] = useState(false)
  const [isClosingPanel, setIsClosingPanel] = useState(false)

  // [Joshen] There seems to be some bug between Checkbox.Group within the Form component
  // hence why this external state as a temporary workaround
  const [events, setEvents] = useState<string[]>([])
  const [eventsError, setEventsError] = useState<string>()

  // For HTTP request
  const [httpHeaders, setHttpHeaders] = useState<HTTPArgument[]>([])
  const [httpParameters, setHttpParameters] = useState<HTTPArgument[]>([])

  const { project } = useProjectContext()
  const { data } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
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

  const initialValues = {
    name: selectedHook?.name ?? '',
    table_id: selectedHook?.table_id ?? '',
    http_url: selectedHook?.function_args?.[0] ?? '',
    http_method: selectedHook?.function_args?.[1] ?? 'POST',
    function_type: isEdgeFunction({ ref, restUrlTld, url: selectedHook?.function_args?.[0] ?? '' })
      ? 'supabase_function'
      : 'http_request',
    timeout_ms: Number(selectedHook?.function_args?.[4] ?? 5000),
  }

  useEffect(() => {
    if (visible) {
      setIsEdited(false)
      setIsClosingPanel(false)

      if (selectedHook !== undefined) {
        setEvents(selectedHook.events)

        const [_, __, headers, parameters] = selectedHook.function_args

        let parsedParameters: Record<string, string> = {}

        // Try to parse the parameters with escaped quotes
        try {
          parsedParameters = JSON.parse(parameters.replace(/\\"/g, '"'))
        } catch (e) {
          // If parsing still fails, fallback to an empty object
          parsedParameters = {}
        }

        let parsedHeaders: Record<string, string> = {}
        try {
          parsedHeaders = JSON.parse(headers.replace(/\\"/g, '"'))
        } catch (e) {
          // If parsing still fails, fallback to an empty object
          parsedHeaders = {}
        }

        setHttpHeaders(
          Object.keys(parsedHeaders).map((key) => {
            return { id: uuidv4(), name: key, value: parsedHeaders[key] }
          })
        )

        setHttpParameters(
          Object.keys(parsedParameters).map((key) => {
            return { id: uuidv4(), name: key, value: parsedParameters[key] }
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

    if (values.timeout_ms < 1000 || values.timeout_ms > 10_000) {
      errors['timeout_ms'] = 'Timeout should be between 1000ms and 10,000ms'
    }

    if (JSON.stringify(values) !== JSON.stringify(initialValues)) setIsEdited(true)
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

    const selectedTable = await getTableEditor({
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

    // replacer function with JSON.stringify to handle quotes properly
    const stringifiedParameters = JSON.stringify(parameters, (key, value) => {
      if (typeof value === 'string') {
        // Return the raw string without any additional escaping
        return value
      }
      return value
    })

    const payload: PGTriggerCreate = {
      events,
      activation: 'AFTER',
      orientation: 'ROW',
      name: values.name,
      table: selectedTable.name,
      schema: selectedTable.schema,
      function_name: 'http_request',
      function_schema: 'supabase_functions',
      function_args: [
        values.http_url,
        values.http_method,
        JSON.stringify(headers),
        stringifiedParameters,
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
        updatedTrigger: { ...payload, enabled_mode: 'ORIGIN' },
      })
    }
  }

  return (
    <>
      <SidePanel
        size="xlarge"
        visible={visible}
        header={
          selectedHook === undefined ? (
            'Create a new database webhook'
          ) : (
            <>
              Update webhook <code className="text-sm">{selectedHook.name}</code>
            </>
          )
        }
        className="hooks-sidepanel mr-0 transform transition-all duration-300 ease-in-out"
        onConfirm={() => {}}
        onCancel={() => onClosePanel()}
        customFooter={
          <div className="flex w-full justify-end space-x-3 border-t border-default px-3 py-4">
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
          </div>
        }
      >
        <Form validateOnBlur initialValues={initialValues} onSubmit={onSubmit} validate={validate}>
          {({ values, resetForm, errors }: any) => {
            return (
              <FormContents
                values={values}
                resetForm={resetForm}
                errors={errors}
                tables={tables}
                events={events}
                eventsError={eventsError}
                onUpdateSelectedEvents={onUpdateSelectedEvents}
                httpHeaders={httpHeaders}
                httpParameters={httpParameters}
                setHttpHeaders={setHttpHeaders}
                setHttpParameters={setHttpParameters}
                submitRef={submitRef}
                selectedHook={selectedHook}
              />
            )
          }}
        </Form>
      </SidePanel>
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
