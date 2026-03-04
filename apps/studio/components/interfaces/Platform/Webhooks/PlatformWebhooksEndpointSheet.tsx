import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import * as z from 'zod'
import { InlineLink } from 'components/ui/InlineLink'
import {
  Button,
  Checkbox_Shadcn_ as Checkbox,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_ as InputField,
  Label_Shadcn_ as Label,
  Separator,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  Switch,
  TextArea_Shadcn_ as Textarea,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import type {
  UpsertWebhookEndpointInput,
  WebhookEndpoint,
  WebhookScope,
} from './PlatformWebhooks.types'

const endpointFormSchema = z
  .object({
    url: z.string().trim().url('Please enter a valid URL'),
    description: z.string().trim().max(512, 'Description cannot exceed 512 characters'),
    enabled: z.boolean().default(true),
    subscribeAll: z.boolean().default(false),
    eventTypes: z.array(z.string()).default([]),
    customHeaders: z
      .array(
        z.object({
          key: z.string().trim(),
          value: z.string().trim(),
        })
      )
      .default([]),
  })
  .superRefine((data, ctx) => {
    if (!data.subscribeAll && data.eventTypes.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select at least one event type',
        path: ['eventTypes'],
      })
    }
  })

export type EndpointFormValues = z.infer<typeof endpointFormSchema>

const toEventTypes = (values: EndpointFormValues) =>
  values.subscribeAll ? ['*'] : values.eventTypes

export const toEndpointPayload = (values: EndpointFormValues): UpsertWebhookEndpointInput => ({
  name: '',
  url: values.url,
  description: values.description,
  enabled: values.enabled,
  eventTypes: toEventTypes(values),
  customHeaders: values.customHeaders,
})

interface EndpointSheetProps {
  visible: boolean
  mode: 'create' | 'edit'
  scope: WebhookScope
  orgSlug?: string
  endpoint?: WebhookEndpoint
  enabledOverride?: boolean | null
  eventTypes: string[]
  onClose: () => void
  onSubmit: (values: EndpointFormValues) => void
}

export const PlatformWebhooksEndpointSheet = ({
  visible,
  mode,
  scope,
  orgSlug,
  endpoint,
  enabledOverride,
  eventTypes,
  onClose,
  onSubmit,
}: EndpointSheetProps) => {
  const form = useForm<EndpointFormValues>({
    resolver: zodResolver(endpointFormSchema),
    defaultValues: {
      url: '',
      description: '',
      enabled: true,
      subscribeAll: false,
      eventTypes: [],
      customHeaders: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'customHeaders',
  })

  const selectedEventTypes = form.watch('eventTypes')
  const subscribeAll = form.watch('subscribeAll')

  useEffect(() => {
    if (!visible) return

    if (!endpoint) {
      form.reset({
        url: '',
        description: '',
        enabled: true,
        subscribeAll: false,
        eventTypes: [],
        customHeaders: [],
      })
      return
    }

    form.reset({
      url: endpoint.url,
      description: endpoint.description,
      enabled: enabledOverride ?? endpoint.enabled,
      subscribeAll: endpoint.eventTypes.includes('*'),
      eventTypes: endpoint.eventTypes.includes('*') ? [] : endpoint.eventTypes,
      customHeaders: endpoint.customHeaders.map((header) => ({
        key: header.key,
        value: header.value,
      })),
    })
  }, [enabledOverride, endpoint, form, visible])

  return (
    <Sheet open={visible} onOpenChange={onClose} >
      <SheetContent showClose={false} size="default" className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>{mode === 'create' ? 'Create endpoint' : 'Edit endpoint'}</SheetTitle>
        </SheetHeader>
        <Separator />
        <SheetSection className="overflow-auto flex-grow px-0 py-0">
          <Form_Shadcn_ {...form}>
            <form
              id="platform-webhook-endpoint-form"
              className="space-y-5 py-5"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <div className="px-5 space-y-5">
                <FormField_Shadcn_
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItemLayout label="Endpoint URL" layout="vertical" className="gap-1">
                      <FormControl_Shadcn_>
                        <InputField
                          {...field}
                          placeholder="https://api.example.com/webhooks/supabase"
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />

                <FormField_Shadcn_
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItemLayout
                      label={<>Description <span className="text-foreground-muted">(optional)</span></>}
                      layout="vertical"
                      className="gap-1"
                    >
                      <FormControl_Shadcn_>
                        <Textarea {...field} rows={4} placeholder="Optional description for this endpoint" className="resize-none" />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />

                {mode === 'edit' && (
                  <FormField_Shadcn_
                    control={form.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItemLayout
                        label="Enable endpoint"
                        description="Disabled endpoints won’t receive deliveries."
                        layout="flex"
                      >
                        <FormControl_Shadcn_>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                )}
              </div>

              <Separator />

              <div className="px-5 space-y-3">
                <FormItemLayout
                  label="Event types"
                  description={
                    scope === 'organization' ? (
                      <>
                        Project events are triggered when any project in this organization matches
                        the event type. Add a{' '}
                        <InlineLink href="/project/_/settings/webhooks">project endpoint</InlineLink>{' '}
                        to listen to events on an individual project only.
                      </>
                    ) : (
                      <>
                        Project events are triggered for this project only. Add an{' '}
                        <InlineLink href={`/org/${orgSlug ?? '_'}/webhooks`}>organization endpoint</InlineLink>{' '}
                        to listen to events from any project in your organization.
                      </>
                    )
                  }
                  layout="vertical"
                  className="gap-3"
                >
                  <FormField_Shadcn_
                    control={form.control}
                    name="subscribeAll"
                    render={({ field }) => (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(!!checked)}
                        />
                        <Label>Subscribe to all events <code className="ml-1 text-code-inline">(*)</code></Label>
                      </div>
                    )}
                  />

                  {!subscribeAll && (
                    <FormField_Shadcn_
                      control={form.control}
                      name="eventTypes"
                      render={({ field }) => (
                        <FormControl_Shadcn_>
                          <div className="space-y-2">
                            {eventTypes.map((eventType) => {
                              const checked = selectedEventTypes.includes(eventType)
                              return (
                                <div key={eventType} className="flex items-center gap-2">
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(next) => {
                                      if (next) {
                                        field.onChange([
                                          ...new Set([...selectedEventTypes, eventType]),
                                        ])
                                      } else {
                                        field.onChange(
                                          selectedEventTypes.filter((value) => value !== eventType)
                                        )
                                      }
                                    }}
                                  />
                                  <Label><code className="text-code-inline">{eventType}</code></Label>
                                </div>
                              )
                            })}
                          </div>
                        </FormControl_Shadcn_>
                      )}
                    />
                  )}
                </FormItemLayout>
              </div>

              <Separator />

              <div className="px-5 space-y-3">
                <FormItemLayout
                  label={<>Custom headers <span className="text-foreground-muted">(optional)</span></>}
                  description="Optional HTTP headers sent with every delivery."
                  layout="vertical"
                  className="gap-3"
                >
                  {fields.length === 0 && (
                    <p className="text-sm text-foreground-light">No custom headers.</p>
                  )}

                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <FormField_Shadcn_
                        control={form.control}
                        name={`customHeaders.${index}.key`}
                        render={({ field }) => (
                          <FormControl_Shadcn_>
                            <InputField {...field} placeholder="Header name" />
                          </FormControl_Shadcn_>
                        )}
                      />
                      <FormField_Shadcn_
                        control={form.control}
                        name={`customHeaders.${index}.value`}
                        render={({ field }) => (
                          <FormControl_Shadcn_>
                            <InputField {...field} placeholder="Header value" />
                          </FormControl_Shadcn_>
                        )}
                      />
                      <Button
                        type="text"
                        onClick={() => remove(index)}
                        icon={<Trash2 size={14} />}
                      />
                    </div>
                  ))}

                  <Button type="default" onClick={() => append({ key: '', value: '' })}>
                    Add header
                  </Button>
                </FormItemLayout>
              </div>
            </form>
          </Form_Shadcn_>
        </SheetSection>
        <SheetFooter>
          <Button type="default" onClick={onClose}>
            Cancel
          </Button>
          <Button form="platform-webhook-endpoint-form" htmlType="submit">
            {mode === 'create' ? 'Create endpoint' : 'Save changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
