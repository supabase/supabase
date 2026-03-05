import { zodResolver } from '@hookform/resolvers/zod'
import { InlineLink } from 'components/ui/InlineLink'
import { DiscardChangesConfirmationDialog } from 'components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { useConfirmOnClose } from 'hooks/ui/useConfirmOnClose'
import { ChevronDown, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import {
  Accordion_Shadcn_ as Accordion,
  AccordionContent_Shadcn_ as AccordionContent,
  AccordionItem_Shadcn_ as AccordionItem,
  AccordionTrigger_Shadcn_ as AccordionTrigger,
  Button,
  Checkbox_Shadcn_ as Checkbox,
  cn,
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
import * as z from 'zod'

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

type EventTypeGroup = {
  id: string
  label: string
  eventTypes: string[]
}

const buildEventTypeGroups = (scope: WebhookScope, eventTypes: string[]): EventTypeGroup[] => {
  if (scope === 'project') {
    return [{ id: 'project', label: 'Project events', eventTypes }]
  }

  const organizationEvents = eventTypes.filter((eventType) => eventType.startsWith('organization.'))
  const projectEvents = eventTypes.filter((eventType) => eventType.startsWith('project.'))
  const ungroupedEvents = eventTypes.filter(
    (eventType) => !eventType.startsWith('organization.') && !eventType.startsWith('project.')
  )

  return [
    { id: 'organization', label: 'Organization events', eventTypes: organizationEvents },
    { id: 'project', label: 'Project events', eventTypes: projectEvents },
    { id: 'other', label: 'Other events', eventTypes: ungroupedEvents },
  ].filter((group) => group.eventTypes.length > 0)
}

const toggleEventType = (selectedEventTypes: string[], eventType: string, checked: boolean) => {
  if (checked) return [...new Set([...selectedEventTypes, eventType])]
  return selectedEventTypes.filter((value) => value !== eventType)
}

const toggleEventTypeGroup = (
  selectedEventTypes: string[],
  groupedEventTypes: string[],
  checked: boolean
) => {
  if (checked) return [...new Set([...selectedEventTypes, ...groupedEventTypes])]
  return selectedEventTypes.filter((value) => !groupedEventTypes.includes(value))
}

const toControlId = (prefix: string, value: string) =>
  `${prefix}-${value.replace(/[^a-zA-Z0-9_-]/g, '-')}`

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
  const isDirty = form.formState.isDirty
  const {
    confirmOnClose,
    handleOpenChange,
    modalProps: discardChangesModalProps,
  } = useConfirmOnClose({
    checkIsDirty: () => isDirty,
    onClose,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'customHeaders',
  })

  const subscribeAll = form.watch('subscribeAll')
  const selectedEventTypes = form.watch('eventTypes')
  const groupedEventTypes = useMemo(
    () => buildEventTypeGroups(scope, eventTypes),
    [scope, eventTypes]
  )
  const [openEventGroups, setOpenEventGroups] = useState<string[]>([])

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
      eventTypes: endpoint.eventTypes.includes('*') ? eventTypes : endpoint.eventTypes,
      customHeaders: endpoint.customHeaders.map((header) => ({
        key: header.key,
        value: header.value,
      })),
    })
  }, [enabledOverride, endpoint, eventTypes, form, visible])

  useEffect(() => {
    if (!visible) return
    setOpenEventGroups(groupedEventTypes.map((group) => group.id))
  }, [groupedEventTypes, visible])

  useEffect(() => {
    if (!visible) return
    const allSelected =
      eventTypes.length > 0 &&
      eventTypes.every((eventType) => selectedEventTypes.includes(eventType))

    if (subscribeAll !== allSelected) {
      form.setValue('subscribeAll', allSelected, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [eventTypes, form, selectedEventTypes, subscribeAll, visible])

  return (
    <Sheet open={visible} onOpenChange={handleOpenChange}>
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
                      label={
                        <>
                          Description <span className="text-foreground-muted">(optional)</span>
                        </>
                      }
                      layout="vertical"
                      className="gap-1"
                    >
                      <FormControl_Shadcn_>
                        <Textarea
                          {...field}
                          rows={4}
                          placeholder="Optional description for this endpoint"
                          className="resize-none"
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />

                {mode === 'edit' && (
                  <FormField_Shadcn_
                    control={form.control}
                    name="enabled"
                    render={({ field }) => {
                      const enabledId = 'enabled-endpoint'
                      return (
                        <div className="rounded-md border bg-surface-100">
                          <Label
                            htmlFor={enabledId}
                            className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3"
                          >
                            <div className="space-y-0.5">
                              <p className="text-sm text-foreground">Enable endpoint</p>
                              <p className="text-sm text-foreground-lighter">
                                Disabled endpoints won’t receive deliveries
                              </p>
                            </div>
                            <FormControl_Shadcn_>
                              <Switch
                                id={enabledId}
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl_Shadcn_>
                          </Label>
                        </div>
                      )
                    }}
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
                        <InlineLink href="/project/_/settings/webhooks">
                          project endpoint
                        </InlineLink>{' '}
                        to listen to events on an individual project only.
                      </>
                    ) : (
                      <>
                        Project events are triggered for this project only. Add an{' '}
                        <InlineLink href={`/org/${orgSlug ?? '_'}/webhooks`}>
                          organization endpoint
                        </InlineLink>{' '}
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
                    render={({ field }) => {
                      const subscribeAllId = 'subscribe-all-events'
                      return (
                        <div className="rounded-md border bg-surface-100   overflow-hidden">
                          <Label
                            htmlFor={subscribeAllId}
                            className={cn(
                              'flex w-full cursor-pointer items-center gap-3 px-4 py-3',
                              field.value ? 'bg-surface-100' : 'bg-surface-200'
                            )}
                          >
                            <FormControl_Shadcn_>
                              <Checkbox
                                id={subscribeAllId}
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  const nextValue = Boolean(checked)
                                  field.onChange(nextValue)

                                  if (nextValue) {
                                    form.setValue('eventTypes', eventTypes, {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    })
                                    return
                                  }

                                  form.setValue('eventTypes', [], {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  })
                                }}
                              />
                            </FormControl_Shadcn_>
                            <span className="text-sm text-foreground">
                              Subscribe to all events <code className="text-code-inline">(*)</code>
                            </span>
                          </Label>
                        </div>
                      )
                    }}
                  />

                  <FormField_Shadcn_
                    control={form.control}
                    name="eventTypes"
                    render={({ field }) => {
                      const selectedTypes = field.value ?? []

                      return (
                        <>
                          <FormControl_Shadcn_>
                            <Accordion
                              type="multiple"
                              value={openEventGroups}
                              onValueChange={setOpenEventGroups}
                              className="mt-2 space-y-2"
                            >
                              {groupedEventTypes.map((group) => {
                                const selectedInGroup = group.eventTypes.filter((eventType) =>
                                  selectedTypes.includes(eventType)
                                )
                                const allSelected =
                                  selectedInGroup.length === group.eventTypes.length
                                const isGroupOpen = openEventGroups.includes(group.id)

                                return (
                                  <AccordionItem
                                    key={group.id}
                                    value={group.id}
                                    className="overflow-hidden rounded-md border"
                                  >
                                    <AccordionTrigger
                                      hideIcon
                                      className="group px-4 py-3 hover:no-underline"
                                    >
                                      <div className="flex w-full items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                          <p className="text-sm text-foreground-light">
                                            {group.label}
                                          </p>
                                          {selectedInGroup.length > 0 && (
                                            <span className="text-xs text-foreground-muted">
                                              {selectedInGroup.length}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                          {isGroupOpen && group.eventTypes.length > 1 && (
                                            <span
                                              className="text-xs text-foreground-muted hover:text-foreground"
                                              onClick={(event) => {
                                                event.preventDefault()
                                                event.stopPropagation()
                                                field.onChange(
                                                  toggleEventTypeGroup(
                                                    selectedTypes,
                                                    group.eventTypes,
                                                    !allSelected
                                                  )
                                                )
                                              }}
                                            >
                                              {allSelected ? 'Clear all' : 'Select all'}
                                            </span>
                                          )}
                                          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                        </div>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-0 pt-0 [&>div]:pb-0 [&>div]:pt-0">
                                      <div className="divide-y border-t">
                                        {group.eventTypes.map((eventType) => {
                                          const checked = selectedTypes.includes(eventType)
                                          const eventTypeId = toControlId('event-type', eventType)

                                          return (
                                            <Label
                                              key={eventType}
                                              htmlFor={eventTypeId}
                                              className={cn(
                                                'flex w-full cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-200',
                                                checked && 'bg-surface-100'
                                              )}
                                            >
                                              <Checkbox
                                                id={eventTypeId}
                                                checked={checked}
                                                onCheckedChange={(next) => {
                                                  field.onChange(
                                                    toggleEventType(
                                                      selectedTypes,
                                                      eventType,
                                                      Boolean(next)
                                                    )
                                                  )
                                                }}
                                              />
                                              <code className="text-code-inline">{eventType}</code>
                                            </Label>
                                          )
                                        })}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                )
                              })}
                            </Accordion>
                          </FormControl_Shadcn_>
                        </>
                      )
                    }}
                  />
                </FormItemLayout>
              </div>

              <Separator />

              <div className="px-5 space-y-3">
                <FormItemLayout
                  label={
                    <>
                      Custom headers <span className="text-foreground-muted">(optional)</span>
                    </>
                  }
                  description="Optional HTTP headers sent with every delivery."
                  layout="vertical"
                  className="gap-3"
                >
                  {fields.length > 0 && (
                    <div className="overflow-hidden rounded-md border divide-y mb-3 bg-surface-100">
                      {fields.map((customHeaderField, index) => (
                        <div key={customHeaderField.id} className="px-3 py-3">
                          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center">
                            <FormField_Shadcn_
                              control={form.control}
                              name={`customHeaders.${index}.key`}
                              render={({ field }) => (
                                <FormControl_Shadcn_>
                                  <InputField
                                    {...field}
                                    placeholder="Header name"
                                    className="font-mono text-xs"
                                  />
                                </FormControl_Shadcn_>
                              )}
                            />
                            <FormField_Shadcn_
                              control={form.control}
                              name={`customHeaders.${index}.value`}
                              render={({ field }) => (
                                <FormControl_Shadcn_>
                                  <InputField
                                    {...field}
                                    placeholder="Header value"
                                    className="font-mono text-xs"
                                  />
                                </FormControl_Shadcn_>
                              )}
                            />
                            <Button
                              type="text"
                              htmlType="button"
                              onClick={() => remove(index)}
                              icon={<Trash2 size={14} />}
                              className="justify-self-start sm:justify-self-auto h-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    type="default"
                    htmlType="button"
                    onClick={() => append({ key: '', value: '' })}
                  >
                    Add header
                  </Button>
                </FormItemLayout>
              </div>
            </form>
          </Form_Shadcn_>
        </SheetSection>
        <SheetFooter>
          <Button type="default" onClick={confirmOnClose}>
            Cancel
          </Button>
          <Button form="platform-webhook-endpoint-form" htmlType="submit">
            {mode === 'create' ? 'Create endpoint' : 'Save changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
      <DiscardChangesConfirmationDialog {...discardChangesModalProps} />
    </Sheet>
  )
}
