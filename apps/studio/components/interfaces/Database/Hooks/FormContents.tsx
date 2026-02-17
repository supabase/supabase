import type { PostgresTrigger } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import Image from 'next/legacy/image'
import { useEffect, useMemo } from 'react'
import { UseFormReturn } from 'react-hook-form'
import {
  Checkbox_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Label_Shadcn_,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SidePanel,
  useWatch_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { isEdgeFunction } from './EditHookPanel'
import { WebhookFormValues } from './EditHookPanel.constants'
import { AVAILABLE_WEBHOOK_TYPES, HOOK_EVENTS } from './Hooks.constants'
import { HTTPHeaders } from './HTTPHeaders'
import { HTTPParameters } from './HTTPParameters'
import { HTTPRequestConfig } from './HTTPRequestConfig'
import {
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from '@/components/ui/Forms/FormSection'
import { useAPIKeysQuery } from '@/data/api-keys/api-keys-query'
import { useEdgeFunctionsQuery } from '@/data/edge-functions/edge-functions-query'
import { useTablesQuery } from '@/data/tables/tables-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { uuidv4 } from '@/lib/helpers'

export interface FormContentsProps {
  form: UseFormReturn<WebhookFormValues>
  selectedHook?: PostgresTrigger
}

export const FormContents = ({ form, selectedHook }: FormContentsProps) => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const restUrl = project?.restUrl
  const restUrlTld = restUrl ? new URL(restUrl).hostname.split('.').pop() : 'co'

  const { can: canReadAPIKeys } = useAsyncCheckPermissions(PermissionAction.SECRETS_READ, '*')
  const { data: keys = [] } = useAPIKeysQuery(
    { projectRef: ref, reveal: true },
    { enabled: canReadAPIKeys }
  )
  const { data: functions = [], isSuccess: isSuccessEdgeFunctions } = useEdgeFunctionsQuery({
    projectRef: ref,
  })

  const legacyServiceRole = keys.find((x) => x.name === 'service_role')?.api_key ?? '[YOUR API KEY]'

  const httpUrl = useWatch_Shadcn_({ control: form.control, name: 'http_url' })
  const httpHeaders = useWatch_Shadcn_({ control: form.control, name: 'httpHeaders' })

  const { data } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const tables = useMemo(
    () => [...(data ?? [])].sort((a, b) => (a.schema > b.schema ? 0 : -1)),
    [data]
  )

  // Handle auth header auto-add for edge functions
  useEffect(() => {
    if (!isSuccessEdgeFunctions) return

    const isEdgeFunctionSelected = isEdgeFunction({ ref, restUrlTld, url: httpUrl })

    if (httpUrl && isEdgeFunctionSelected) {
      const fnSlug = httpUrl.split('/').at(-1)
      const fn = functions.find((x) => x.slug === fnSlug)
      const authorizationHeader = httpHeaders.find((x) => x.name === 'Authorization')
      const edgeFunctionAuthHeaderVal = `Bearer ${legacyServiceRole}`

      if (fn?.verify_jwt && authorizationHeader == null) {
        const newAuthHeader = {
          id: uuidv4(),
          name: 'Authorization',
          value: edgeFunctionAuthHeaderVal,
        }
        form.setValue('httpHeaders', [...httpHeaders, newAuthHeader])
      } else if (fn?.verify_jwt && authorizationHeader?.value !== edgeFunctionAuthHeaderVal) {
        const updatedHttpHeaders = httpHeaders.map((x) => {
          if (x.name === 'Authorization') return { ...x, value: edgeFunctionAuthHeaderVal }
          else return x
        })
        form.setValue('httpHeaders', updatedHttpHeaders)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [httpUrl, isSuccessEdgeFunctions])

  return (
    <div>
      <FormSection header={<FormSectionLabel className="lg:!col-span-4">General</FormSectionLabel>}>
        <FormSectionContent loading={false} className="lg:!col-span-8">
          <FormField_Shadcn_
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItemLayout label="Name" layout="vertical" className="gap-1">
                <FormControl_Shadcn_>
                  <Input_Shadcn_ {...field} placeholder="my_webhook" />
                </FormControl_Shadcn_>
                <p className="mt-2 text-xs text-foreground-lighter">
                  Do not use spaces/whitespaces
                </p>
              </FormItemLayout>
            )}
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
          <FormField_Shadcn_
            control={form.control}
            name="table_id"
            render={({ field }) => (
              <FormItemLayout
                label="Table"
                layout="vertical"
                className="gap-1"
                description="This is the table the trigger will watch for changes. You can only select 1 table for a trigger."
              >
                <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                  <FormControl_Shadcn_>
                    <SelectTrigger_Shadcn_>
                      <SelectValue_Shadcn_ placeholder="Select a table" />
                    </SelectTrigger_Shadcn_>
                  </FormControl_Shadcn_>
                  <SelectContent_Shadcn_>
                    {tables.map((table) => (
                      <SelectItem_Shadcn_ key={table.id} value={table.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <span className="text-foreground-light">{table.schema}</span>
                          <span className="text-foreground">{table.name}</span>
                        </div>
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </FormItemLayout>
            )}
          />

          <FormField_Shadcn_
            control={form.control}
            name="events"
            render={({ field }) => (
              <FormItemLayout
                label="Events"
                layout="vertical"
                className="gap-1"
                description="These are the events that are watched by the webhook, only the events selected above will fire the webhook on the table you've selected."
              >
                <div className="space-y-3">
                  {HOOK_EVENTS.map((event) => (
                    <div key={event.value} className="flex items-start space-x-3">
                      <Checkbox_Shadcn_
                        id={`event-${event.value}`}
                        checked={field.value.includes(event.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange([...field.value, event.value])
                          } else {
                            field.onChange(field.value.filter((v) => v !== event.value))
                          }
                        }}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label_Shadcn_
                          htmlFor={`event-${event.value}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {event.label}
                        </Label_Shadcn_>
                        <p className="text-xs text-foreground-lighter">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </FormItemLayout>
            )}
          />
        </FormSectionContent>
      </FormSection>
      <SidePanel.Separator />
      <FormSection
        header={
          <FormSectionLabel className="lg:!col-span-4">Webhook configuration</FormSectionLabel>
        }
      >
        <FormSectionContent loading={false} className="lg:!col-span-8">
          <FormField_Shadcn_
            control={form.control}
            name="function_type"
            render={({ field }) => (
              <FormItemLayout label="Type of webhook" layout="vertical" className="gap-1">
                <FormControl_Shadcn_>
                  <RadioGroupStacked
                    value={field.value}
                    onValueChange={(functionType) => {
                      if (functionType === 'http_request') {
                        if (selectedHook !== undefined) {
                          const [url] = selectedHook.function_args
                          form.setValue('http_url', url, { shouldDirty: false })
                        } else {
                          form.setValue('http_url', '', { shouldDirty: false })
                        }
                      } else if (functionType === 'supabase_function') {
                        // Default to first edge function in the list
                        const fnSlug = functions[0]?.slug
                        const defaultFunctionUrl = `https://${ref}.supabase.${restUrlTld}/functions/v1/${fnSlug}`
                        const currentUrl = form.getValues('http_url')
                        if (!isEdgeFunction({ ref, restUrlTld, url: currentUrl })) {
                          form.setValue('http_url', defaultFunctionUrl, { shouldDirty: false })
                        }
                      }
                      field.onChange(functionType)
                    }}
                  >
                    {AVAILABLE_WEBHOOK_TYPES.map((webhook) => (
                      <RadioGroupStackedItem
                        key={webhook.value}
                        id={webhook.value}
                        value={webhook.value}
                        label=""
                        showIndicator={false}
                      >
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
                      </RadioGroupStackedItem>
                    ))}
                  </RadioGroupStacked>
                </FormControl_Shadcn_>
              </FormItemLayout>
            )}
          />
        </FormSectionContent>
      </FormSection>
      <SidePanel.Separator />
      <HTTPRequestConfig form={form} />
      <SidePanel.Separator />
      <HTTPHeaders form={form} />
      <SidePanel.Separator />
      <HTTPParameters form={form} />
    </div>
  )
}
