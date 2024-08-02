import { useParams } from 'common'
import { DATADOG_REGIONS, LOG_DRAIN_TYPES, LogDrainType } from './LogDrains.constants'

import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Switch,
  Sheet,
  SheetContent,
  SheetSection,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectLabel_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  cn,
} from 'ui'

import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { TrashIcon } from 'lucide-react'
import { LogDrainData, useLogDrainsQuery } from 'data/log-drains/log-drains-query'
import { InfoTooltip } from 'ui-patterns/info-tooltip'

const FORM_ID = 'log-drain-destination-form'

const formUnion = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('webhook'),
    url: z.string().url('Webhook URL is required and must be a valid URL'),
    http: z.enum(['http1', 'http2']),
    gzip: z.boolean(),
    headers: z.record(z.string(), z.string()).optional(),
  }),
  z.object({
    type: z.literal('datadog'),
    api_key: z.string().min(1, { message: 'API key is required' }),
    region: z.string().min(1, { message: 'Region is required' }),
  }),
  z.object({
    type: z.literal('elastic'),
    url: z.string().url({ message: 'URL is required and must be a valid URL' }),
    username: z.string().min(1, { message: 'Username is required' }),
    password: z.string().min(1, { message: 'Password is required' }),
  }),
  z.object({
    type: z.literal('postgres'),
  }),
  z.object({
    type: z.literal('bigquery'),
  }),
])

const formSchema = z
  .object({
    name: z.string().min(1, {
      message: 'Destination name is required',
    }),
    description: z.string().optional(),
  })
  .and(formUnion)

function LogDrainFormItem({
  value,
  label,
  description,
  formControl,
  placeholder,
  type,
  defaultValue,
}: {
  value: string
  label: string
  formControl: any
  placeholder?: string
  description?: string
  type?: string
  defaultValue?: string
}) {
  return (
    <FormField_Shadcn_
      name={value}
      control={formControl}
      render={({ field }) => (
        <FormItemLayout layout="horizontal" label={label} description={description || ''}>
          <FormControl_Shadcn_>
            <Input_Shadcn_
              defaultValue={defaultValue}
              type={type || 'text'}
              placeholder={placeholder}
              {...field}
            />
          </FormControl_Shadcn_>
        </FormItemLayout>
      )}
    />
  )
}

type DefaultValues = { type: LogDrainType } & Partial<LogDrainData>

export function LogDrainDestinationSheetForm({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  isLoading,
  mode,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultValues?: DefaultValues
  isLoading?: boolean
  onSubmit: (values: z.infer<typeof formSchema>) => void
  mode: 'create' | 'update'
}) {
  const { ref } = useParams()
  const { data: logDrains } = useLogDrainsQuery({
    ref,
  })

  const defaultType = defaultValues?.type || 'webhook'
  const [newCustomHeader, setNewCustomHeader] = useState({ name: '', value: '' })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      name: defaultValues?.name || '',
      description: defaultValues?.description || '',
      type: defaultType,
      http: defaultValues?.config?.http || 'http2',
      gzip: defaultValues?.config?.gzip || true,
      headers: defaultValues?.config?.headers || {},
      url: defaultValues?.config?.url || '',
      api_key: defaultValues?.config?.api_key || '',
      region: defaultValues?.config?.region || '',
      username: defaultValues?.config?.username || '',
      password: defaultValues?.config?.password || '',
    },
  })

  const headers = form.watch('headers')
  const type = form.watch('type')

  function removeHeader(key: string) {
    const newHeaders = {
      ...headers,
    }
    delete newHeaders[key]
    form.setValue('headers', newHeaders)
  }

  function addHeader() {
    const formHeaders = form.getValues('headers')
    if (!formHeaders) return
    const headerKeys = Object.keys(formHeaders)
    if (headerKeys?.length === 20) {
      toast.error('You can only have 20 custom headers')
      return
    }
    if (headerKeys?.includes(newCustomHeader.name)) {
      toast.error('Header name already exists')
      return
    }
    if (!newCustomHeader.name || !newCustomHeader.value) {
      toast.error('Header name and value are required')
      return
    }
    form.setValue('headers', { ...formHeaders, [newCustomHeader.name]: newCustomHeader.value })
    setNewCustomHeader({ name: '', value: '' })
  }

  const hasHeaders = Object.keys(headers || {})?.length > 0

  useEffect(() => {
    if (mode === 'create' && !open) {
      form.reset()
    }
  }, [mode, open, form])

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        setNewCustomHeader({ name: '', value: '' })
        onOpenChange(v)
      }}
    >
      <SheetContent tabIndex={undefined} showClose={false} size="lg" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add destination</SheetTitle>
        </SheetHeader>
        <SheetSection>
          <Form_Shadcn_ {...form}>
            <form
              id={FORM_ID}
              onSubmit={(e) => {
                e.preventDefault()

                // Temp check to make sure the name is unique
                const logDrainName = form.getValues('name')
                const logDrainExists = logDrains?.find((drain) => drain.name === logDrainName)
                if (logDrainExists && mode === 'create') {
                  toast.error('Log drain name already exists')
                  return
                }

                form.handleSubmit(onSubmit)(e)
              }}
            >
              <div className="space-y-4">
                <LogDrainFormItem
                  value="name"
                  placeholder="My Destination"
                  label="Name"
                  formControl={form.control}
                />
                {/* <LogDrainFormItem
                  value="description"
                  placeholder="My Destination"
                  label="Description"
                  formControl={form.control}
                /> */}
                {mode === 'create' && (
                  <RadioGroupStacked
                    defaultValue={defaultType}
                    value={form.getValues('type')}
                    onValueChange={(v: LogDrainType) => form.setValue('type', v)}
                  >
                    {LOG_DRAIN_TYPES.map((type) => (
                      <RadioGroupStackedItem
                        value={type.value}
                        key={type.value}
                        id={type.value}
                        label={type.name}
                        description={type.description}
                        className="text-left"
                      />
                    ))}
                  </RadioGroupStacked>
                )}
              </div>

              <div className="space-y-4 mt-6">
                {type === 'webhook' && (
                  <>
                    <LogDrainFormItem
                      value="url"
                      label="Webhook URL"
                      formControl={form.control}
                      placeholder="https://example.com/webhooks/log-drain"
                    />
                    <FormField_Shadcn_
                      control={form.control}
                      name="http"
                      render={({ field }) => (
                        <FormItem_Shadcn_>
                          <FormControl_Shadcn_>
                            <RadioGroupStacked onValueChange={field.onChange} value={field.value}>
                              <FormItem_Shadcn_ asChild>
                                <FormControl_Shadcn_>
                                  <RadioGroupStackedItem value="http1" label="HTTP/1" />
                                </FormControl_Shadcn_>
                              </FormItem_Shadcn_>
                              <FormItem_Shadcn_ asChild>
                                <FormControl_Shadcn_>
                                  <RadioGroupStackedItem value="http2" label="HTTP/2" />
                                </FormControl_Shadcn_>
                              </FormItem_Shadcn_>
                            </RadioGroupStacked>
                          </FormControl_Shadcn_>
                          <FormMessage_Shadcn_ />
                        </FormItem_Shadcn_>
                      )}
                    />

                    {/* <FormField_Shadcn_
                      control={form.control}
                      name="gzip"
                      render={({ field }) => (
                        <FormItem_Shadcn_ className="space-y-2">
                          <div className="flex gap-2 items-center">
                            <FormControl_Shadcn_>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl_Shadcn_>
                            <FormLabel_Shadcn_ className="text-base">Gzip</FormLabel_Shadcn_>
                            <InfoTooltip align="start">
                              Gzip compresses logs before sending it to the destination.
                            </InfoTooltip>
                          </div>
                        </FormItem_Shadcn_>
                      )}
                    /> */}

                    <div>
                      <FormLabel_Shadcn_>Custom Headers</FormLabel_Shadcn_>
                      {hasHeaders &&
                        Object.keys(headers || {})?.map((headerKey) => (
                          <div
                            className="flex hover:bg-background-alternative text-sm text-foreground items-center font-mono border-b p-1.5 group"
                            key={headerKey}
                          >
                            <div className="w-full px-1">{headerKey}</div>
                            <div className="w-full px-1 truncate" title={headers?.[headerKey]}>
                              {headers?.[headerKey]}
                            </div>
                            <Button
                              className="justify-self-end opacity-0 group-hover:opacity-100"
                              type="text"
                              title="Remove"
                              icon={<TrashIcon />}
                              onClick={() => removeHeader(headerKey)}
                            ></Button>
                          </div>
                        ))}
                    </div>
                  </>
                )}
                {type === 'datadog' && (
                  <div className="grid gap-4">
                    <LogDrainFormItem
                      type="password"
                      value="api_key"
                      label="API Key"
                      formControl={form.control}
                      description="The API Key obtained from the Datadog dashboard."
                    />
                    <FormField_Shadcn_
                      name="region"
                      control={form.control}
                      render={({ field }) => (
                        <FormItemLayout layout="horizontal" label={'Region'}>
                          <FormControl_Shadcn_>
                            <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger_Shadcn_ className="col-span-3">
                                <SelectValue_Shadcn_ placeholder="Select a region" />
                              </SelectTrigger_Shadcn_>
                              <SelectContent_Shadcn_>
                                <SelectGroup_Shadcn_>
                                  <SelectLabel_Shadcn_>Region</SelectLabel_Shadcn_>
                                  {DATADOG_REGIONS.map((reg) => (
                                    <SelectItem_Shadcn_ key={reg.value} value={reg.value}>
                                      {reg.label}
                                    </SelectItem_Shadcn_>
                                  ))}
                                </SelectGroup_Shadcn_>
                              </SelectContent_Shadcn_>
                            </Select_Shadcn_>
                          </FormControl_Shadcn_>
                        </FormItemLayout>
                      )}
                    />
                  </div>
                )}
                {type === 'elastic' && (
                  <div className="grid gap-4">
                    <LogDrainFormItem value="url" label="Filebeat URL" formControl={form.control} />
                    <LogDrainFormItem
                      value="username"
                      label="Username"
                      formControl={form.control}
                    />
                    <LogDrainFormItem
                      type="password"
                      value="password"
                      label="Password"
                      formControl={form.control}
                    />
                  </div>
                )}
              </div>
            </form>
          </Form_Shadcn_>

          {/* This form needs to be outside the <Form_Shadcn_> */}
          {type === 'webhook' && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                addHeader()
              }}
              className="flex gap-2 mt-2 items-center"
            >
              <Input_Shadcn_
                size={'tiny'}
                type="text"
                placeholder="x-header-name"
                value={newCustomHeader.name}
                onChange={(e) => setNewCustomHeader({ ...newCustomHeader, name: e.target.value })}
              />
              <Input_Shadcn_
                size={'tiny'}
                type="text"
                placeholder="Header value"
                value={newCustomHeader.value}
                onChange={(e) => setNewCustomHeader({ ...newCustomHeader, value: e.target.value })}
              />

              <Button htmlType="submit" type="outline">
                Add
              </Button>
            </form>
          )}
        </SheetSection>

        <SheetFooter className="p-4">
          <Button form={FORM_ID} loading={isLoading} htmlType="submit" type="primary">
            Save destination
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
