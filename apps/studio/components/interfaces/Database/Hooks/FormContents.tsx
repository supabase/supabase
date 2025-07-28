import type { PostgresTable, PostgresTrigger } from '@supabase/postgres-meta'
import Image from 'next/legacy/image'
import { MutableRefObject, useEffect } from 'react'

import { useParams } from 'common'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import { useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { uuidv4 } from 'lib/helpers'
import { Checkbox, Input, Listbox, Radio, SidePanel } from 'ui'
import { HTTPArgument, isEdgeFunction } from './EditHookPanel'
import HTTPRequestFields from './HTTPRequestFields'
import { AVAILABLE_WEBHOOK_TYPES, HOOK_EVENTS } from './Hooks.constants'

export interface FormContentsProps {
  values: any
  resetForm: any
  errors: any
  selectedHook?: PostgresTrigger
  tables: PostgresTable[]
  events: string[]
  eventsError?: string
  onUpdateSelectedEvents: (event: string) => void
  httpHeaders: HTTPArgument[]
  httpParameters: HTTPArgument[]
  setHttpHeaders: (arr: HTTPArgument[]) => void
  setHttpParameters: (arr: HTTPArgument[]) => void
  submitRef: MutableRefObject<any>
}

export const FormContents = ({
  values,
  resetForm,
  errors,
  selectedHook,
  tables,
  events,
  eventsError,
  onUpdateSelectedEvents,
  httpHeaders,
  httpParameters,
  setHttpHeaders,
  setHttpParameters,
  submitRef,
}: FormContentsProps) => {
  const { ref } = useParams()
  const project = useSelectedProject()

  const restUrl = project?.restUrl
  const restUrlTld = restUrl ? new URL(restUrl).hostname.split('.').pop() : 'co'

  const { data: keys = [] } = useAPIKeysQuery({ projectRef: ref, reveal: true })
  const { data: functions = [] } = useEdgeFunctionsQuery({ projectRef: ref })

  const legacyServiceRole = keys.find((x) => x.name === 'service_role')?.api_key ?? '[YOUR API KEY]'

  useEffect(() => {
    if (values.function_type === 'http_request') {
      if (selectedHook !== undefined) {
        const [url, method] = selectedHook.function_args
        const updatedValues = { ...values, http_url: url, http_method: method }
        resetForm({ values: updatedValues, initialValues: updatedValues })
      } else {
        const updatedValues = { ...values, http_url: '' }
        resetForm({ values: updatedValues, initialValues: updatedValues })
      }
    } else if (values.function_type === 'supabase_function') {
      // Default to first edge function in the list
      const fnSlug = functions[0]?.slug
      const defaultFunctionUrl = `https://${ref}.supabase.${restUrlTld}/functions/v1/${fnSlug}`
      const updatedValues = {
        ...values,
        http_url: isEdgeFunction({ ref, restUrlTld, url: values.http_url })
          ? values.http_url
          : defaultFunctionUrl,
      }
      resetForm({ values: updatedValues, initialValues: updatedValues })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.function_type])

  useEffect(() => {
    const isEdgeFunctionSelected = isEdgeFunction({ ref, restUrlTld, url: values.http_url })

    if (values.http_url && isEdgeFunctionSelected) {
      const fnSlug = values.http_url.split('/').at(-1)
      const fn = functions.find((x) => x.slug === fnSlug)

      if (fn?.verify_jwt) {
        if (!httpHeaders.some((x) => x.name === 'Authorization')) {
          const authorizationHeader = {
            id: uuidv4(),
            name: 'Authorization',
            value: `Bearer ${legacyServiceRole}`,
          }
          setHttpHeaders([...httpHeaders, authorizationHeader])
        }
      } else {
        const updatedHttpHeaders = httpHeaders.filter((x) => x.name !== 'Authorization')
        setHttpHeaders(updatedHttpHeaders)
      }
    } else {
      const updatedHttpHeaders = httpHeaders.filter((x) => x.name !== 'Authorization')
      setHttpHeaders(updatedHttpHeaders)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.http_url])

  return (
    <div>
      <FormSection header={<FormSectionLabel className="lg:!col-span-4">General</FormSectionLabel>}>
        <FormSectionContent loading={false} className="lg:!col-span-8">
          <Input
            id="name"
            name="name"
            label="Name"
            descriptionText="Do not use spaces/whitespaces"
          />
        </FormSectionContent>
      </FormSection>
      <SidePanel.Separator />
      <FormSection
        header={
          <FormSectionLabel
            className="lg:!col-span-4"
            description={
              <p className="text-sm text-foreground-light">
                Select which table and events will trigger your webhook
              </p>
            }
          >
            Conditions to fire webhook
          </FormSectionLabel>
        }
      >
        <FormSectionContent loading={false} className="lg:!col-span-8">
          <Listbox
            size="medium"
            id="table_id"
            name="table_id"
            label="Table"
            descriptionText="This is the table the trigger will watch for changes. You can only select 1 table for a trigger."
          >
            <Listbox.Option
              key={'table-no-selection'}
              id={'table-no-selection'}
              label={'---'}
              value={'no-selection'}
            >
              ---
            </Listbox.Option>
            {tables.map((table) => (
              <Listbox.Option
                key={table.id}
                id={table.id.toString()}
                value={table.id}
                label={table.name}
              >
                <div className="flex items-center space-x-2">
                  <p className="text-foreground-light">{table.schema}</p>
                  <p className="text-foreground">{table.name}</p>
                </div>
              </Listbox.Option>
            ))}
          </Listbox>
          <Checkbox.Group
            id="events"
            name="events"
            label="Events"
            error={eventsError}
            descriptionText="These are the events that are watched by the webhook, only the events selected above will fire the webhook on the table you've selected."
          >
            {HOOK_EVENTS.map((event) => (
              <Checkbox
                key={event.value}
                value={event.value}
                label={event.label}
                description={event.description}
                checked={events.includes(event.value)}
                onChange={() => onUpdateSelectedEvents(event.value)}
              />
            ))}
          </Checkbox.Group>
        </FormSectionContent>
      </FormSection>
      <SidePanel.Separator />
      <FormSection
        header={
          <FormSectionLabel className="lg:!col-span-4">Webhook configuration</FormSectionLabel>
        }
      >
        <FormSectionContent loading={false} className="lg:!col-span-8">
          <Radio.Group id="function_type" name="function_type" label="Type of webhook" type="cards">
            {AVAILABLE_WEBHOOK_TYPES.map((webhook) => (
              <Radio
                key={webhook.value}
                id={webhook.value}
                value={webhook.value}
                label=""
                beforeLabel={
                  <div className="flex items-center space-x-5">
                    <Image
                      alt={webhook.label}
                      src={webhook.icon}
                      layout="fixed"
                      width="32"
                      height="32"
                    />
                    <div className="flex-col space-y-0">
                      <div className="flex space-x-2">
                        <p className="text-foreground">{webhook.label}</p>
                      </div>
                      <p className="text-foreground-light">{webhook.description}</p>
                    </div>
                  </div>
                }
              />
            ))}
          </Radio.Group>
        </FormSectionContent>
      </FormSection>
      <SidePanel.Separator />

      <HTTPRequestFields
        type={values.function_type}
        errors={errors}
        httpHeaders={httpHeaders}
        httpParameters={httpParameters}
        onAddHeaders={(headers?: any[]) => {
          if (headers) setHttpHeaders(httpHeaders.concat(headers))
          else setHttpHeaders(httpHeaders.concat({ id: uuidv4(), name: '', value: '' }))
        }}
        onUpdateHeader={(idx, property, value) =>
          setHttpHeaders(
            httpHeaders.map((header, i) => {
              if (idx === i) return { ...header, [property]: value }
              else return header
            })
          )
        }
        onRemoveHeader={(idx) => setHttpHeaders(httpHeaders.filter((_, i) => idx !== i))}
        onAddParameter={() =>
          setHttpParameters(httpParameters.concat({ id: uuidv4(), name: '', value: '' }))
        }
        onUpdateParameter={(idx, property, value) =>
          setHttpParameters(
            httpParameters.map((param, i) => {
              if (idx === i) return { ...param, [property]: value }
              else return param
            })
          )
        }
        onRemoveParameter={(idx) => setHttpParameters(httpParameters.filter((_, i) => idx !== i))}
      />

      <button ref={submitRef} type="submit" className="hidden" />
    </div>
  )
}
