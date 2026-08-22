import type { PGTrigger } from '@supabase/pg-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import Image from 'next/legacy/image'
import { useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'
import {
  Checkbox,
  FormControl,
  FormField,
  Input,
  Label,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SidePanel,
  useWatch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

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
import { useTableNamesQuery } from '@/data/tables/table-names-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { buildDatabaseEdgeFunctionUrl, isEdgeFunctionUrl } from '@/lib/api/edgeFunctions'
import { uuidv4 } from '@/lib/helpers'

export interface FormContentsProps {
  form: UseFormReturn<WebhookFormValues>
  selectedHook?: PGTrigger
}

export const FormContents = ({ form, selectedHook }: FormContentsProps) => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const restUrl = project?.restUrl

  const { can: canReadAPIKeys, isSuccess: isPermissionsSuccess } = useAsyncCheckPermissions(
    PermissionAction.SECRETS_READ,
    '*'
  )
  const { data: keys = [], isSuccess: isAPIKeysSuccess } = useAPIKeysQuery(
    { projectRef: ref, reveal: true },
    { enabled: canReadAPIKeys }
  )
  const { data: functions = [], isSuccess: isSuccessEdgeFunctions } = useEdgeFunctionsQuery({
    projectRef: ref,
  })

  const legacyServiceRole = keys.find((x) => x.name === 'service_role')?.api_key ?? '[YOUR API KEY]'

  // The service role key is only "final" once we know we're not still waiting on
  // it: either the API keys query has completed, or the user doesn't have
  // permission to read it at all (so it will never resolve to a real value).
  // Without this, if the edge functions list loads before the API keys do, the
  // default header below could get written with the `[YOUR API KEY]` placeholder
  // and then never get corrected once the real key arrives.
  const isServiceRoleKeyResolved = isPermissionsSuccess && (!canReadAPIKeys || isAPIKeysSuccess)

  const httpUrl = useWatch({ control: form.control, name: 'http_url' })

  const { data: tables = [] } = useTableNamesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  // Auto-add a default Authorization header for edge functions that require JWT
  // verification, but only when one isn't already present. This must NOT watch
  // `httpHeaders` (or otherwise re-run on every header edit): doing so previously
  // caused this effect to immediately overwrite any manual edit to the Authorization
  // header's value (including trying to clear/remove it), since every keystroke
  // updated `httpHeaders`, re-triggered the effect, and got reverted back to the
  // computed service role token. See: header value appears "stuck" and uneditable.
  useEffect(() => {
    if (!isSuccessEdgeFunctions || !isServiceRoleKeyResolved) return

    const isEdgeFunctionSelected = isEdgeFunctionUrl(httpUrl, ref ?? '', restUrl)
    if (!httpUrl || !isEdgeFunctionSelected) return

    // Drop empty segments so a trailing slash on the URL doesn't turn the slug
    // into an empty string (which would never match a function).
    const pathSegments = httpUrl.split('/').filter(Boolean)
    const fnSlug = pathSegments.at(-1)
    const fn = functions.find((x) => x.slug === fnSlug)
    if (!fn?.verify_jwt) return

    const currentHeaders = form.getValues('httpHeaders')
    // Header names are case-insensitive, so an existing lowercase/mixed-case
    // "authorization" row still counts as already present.
    const authorizationHeader = currentHeaders.find(
      (x) => x.name.toLowerCase() === 'authorization'
    )
    if (authorizationHeader != null) return

    const newAuthHeader = {
      id: uuidv4(),
      name: 'Authorization',
      value: `Bearer ${legacyServiceRole}`,
    }
    form.setValue('httpHeaders', [...currentHeaders, newAuthHeader])
  }, [
    form,
    functions,
    httpUrl,
    isServiceRoleKeyResolved,
    isSuccessEdgeFunctions,
    legacyServiceRole,
    ref,
    restUrl,
  ])

  return (
    <div>
      <FormSection header={<FormSectionLabel className="lg:col-span-4!">General</FormSectionLabel>}>
        <FormSectionContent loading={false} className="lg:col-span-8!">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItemLayout label="Name" layout="vertical" className="gap-1">
                <FormControl>
                  <Input {...field} placeholder="my_webhook" />
                </FormControl>
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
            className="lg:col-span-4!"
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
        <FormSectionContent loading={false} className="lg:col-span-8!">
          <FormField
            control={form.control}
            name="table_id"
            render={({ field }) => (
              <FormItemLayout
                label="Table"
                layout="vertical"
                className="gap-1"
                description="This is the table the trigger will watch for changes. You can only select 1 table for a trigger."
              >
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a table" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tables.map((table) => (
                      <SelectItem key={table.id} value={table.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <span className="text-foreground-light">{table.schema}</span>
                          <span className="text-foreground">{table.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItemLayout>
            )}
          />

          <FormField
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
                      <Checkbox
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
                        <Label
                          htmlFor={`event-${event.value}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {event.label}
                        </Label>
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
          <FormSectionLabel className="lg:col-span-4!">Webhook configuration</FormSectionLabel>
        }
      >
        <FormSectionContent loading={false} className="lg:col-span-8!">
          <FormField
            control={form.control}
            name="function_type"
            render={({ field }) => (
              <FormItemLayout label="Type of webhook" layout="vertical" className="gap-1">
                <FormControl>
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
                        const defaultFunctionUrl = buildDatabaseEdgeFunctionUrl(
                          fnSlug ?? '',
                          ref ?? '',
                          restUrl
                        )
                        const currentUrl = form.getValues('http_url')
                        if (!isEdgeFunctionUrl(currentUrl, ref ?? '', restUrl)) {
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
                        <div className="flex items-center gap-5">
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
                </FormControl>
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
