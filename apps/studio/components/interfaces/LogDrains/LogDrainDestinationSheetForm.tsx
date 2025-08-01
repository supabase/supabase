import { zodResolver } from '@hookform/resolvers/zod'
import { TrashIcon } from 'lucide-react'
import { ReactNode, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useParams } from 'common'
import { LogDrainData, useLogDrainsQuery } from 'data/log-drains/log-drains-query'

import { DocsButton } from 'components/ui/DocsButton'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
  RadioGroupCard,
  RadioGroupCardItem,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectLabel_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import { urlRegex } from '../Auth/Auth.constants'
import { DATADOG_REGIONS, LOG_DRAIN_TYPES, LogDrainType } from './LogDrains.constants'

const FORM_ID = 'log-drain-destination-form'

const formUnion = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('webhook'),
    url: z.string().regex(urlRegex(), 'Endpoint URL is required and must be a valid URL'),
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
  }),
  z.object({
    type: z.literal('postgres'),
  }),
  z.object({
    type: z.literal('bigquery'),
  }),
  z.object({
    type: z.literal('loki'),
    url: z.string().min(1, { message: 'Loki URL is required' }),
    headers: z.record(z.string(), z.string()),
    username: z.string().optional(),
    password: z.string().optional(),
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
  description?: ReactNode
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
  // NOTE(kamil): This used to be `any` for a long long time, but after moving to Zod,
  // it produces a correct union type of all possible configs. Unfortunately, this type was not designed correctly
  // and it does not include `type` inside the config itself, so it's not trivial to create `discriminatedUnion`
  // out of it, therefore for an ease of use now, we bail to `any` until the better time come.
  const defaultConfig = (defaultValues?.config || {}) as any
  const CREATE_DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
  }
  const DEFAULT_HEADERS = mode === 'create' ? CREATE_DEFAULT_HEADERS : defaultConfig?.headers || {}

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
      http: defaultConfig?.http || 'http2',
      gzip: mode === 'create' ? true : defaultConfig?.gzip || false,
      headers: DEFAULT_HEADERS,
      url: defaultConfig?.url || '',
      api_key: defaultConfig?.api_key || '',
      region: defaultConfig?.region || '',
      username: defaultConfig?.username || '',
      password: defaultConfig?.password || '',
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

  function getHeadersSectionDescription() {
    if (type === 'webhook') {
      return 'Set custom headers when draining logs to the Endpoint URL'
    }
    if (type === 'loki') {
      return 'Set custom headers when draining logs to the Loki HTTP(S) endpoint'
    }
    return ''
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        setNewCustomHeader({ name: '', value: '' })
        onOpenChange(v)
      }}
    >
      <SheetContent
        tabIndex={undefined}
        showClose={false}
        size="lg"
        className="overflow-y-auto flex flex-col"
      >
        <SheetHeader>
          <SheetTitle>Add destination</SheetTitle>
        </SheetHeader>
        <SheetSection className="!px-0 !pb-0">
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
              <div className="space-y-8 px-content">
                <LogDrainFormItem
                  value="name"
                  placeholder="My Destination"
                  label="Name"
                  formControl={form.control}
                />
                <LogDrainFormItem
                  value="description"
                  placeholder="My Destination"
                  label="Description"
                  formControl={form.control}
                />
                {mode === 'create' && (
                  <FormItemLayout
                    layout="horizontal"
                    label="Type"
                    description={LOG_DRAIN_TYPES.find((t) => t.value === type)?.description || ''}
                  >
                    <Select_Shadcn_
                      defaultValue={defaultType}
                      value={form.getValues('type')}
                      onValueChange={(v: LogDrainType) => form.setValue('type', v)}
                    >
                      <SelectTrigger_Shadcn_>
                        {LOG_DRAIN_TYPES.find((t) => t.value === type)?.name}
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        {LOG_DRAIN_TYPES.map((type) => (
                          <SelectItem_Shadcn_
                            value={type.value}
                            key={type.value}
                            id={type.value}
                            className="text-left"
                          >
                            {type.name}
                          </SelectItem_Shadcn_>
                        ))}
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  </FormItemLayout>
                )}
              </div>

              <div className="space-y-8 mt-4">
                {type === 'webhook' && (
                  <>
                    <div className="px-content space-y-8">
                      <LogDrainFormItem
                        value="url"
                        label="Endpoint URL"
                        formControl={form.control}
                        placeholder="https://example.com/log-drain"
                      />
                      <FormField_Shadcn_
                        control={form.control}
                        name="http"
                        render={({ field }) => (
                          <FormItemLayout layout="horizontal" label="HTTP Version">
                            <FormControl_Shadcn_>
                              <RadioGroupCard
                                className="flex gap-2"
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormItem_Shadcn_ asChild>
                                  <FormControl_Shadcn_>
                                    <RadioGroupCardItem value="http1" label="HTTP/1" />
                                  </FormControl_Shadcn_>
                                </FormItem_Shadcn_>
                                <FormItem_Shadcn_ asChild>
                                  <FormControl_Shadcn_>
                                    <RadioGroupCardItem value="http2" label="HTTP/2" />
                                  </FormControl_Shadcn_>
                                </FormItem_Shadcn_>
                              </RadioGroupCard>
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />
                    </div>

                    <FormField_Shadcn_
                      control={form.control}
                      name="gzip"
                      render={({ field }) => (
                        <FormItem_Shadcn_ className="space-y-2 px-4">
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
                    />
                  </>
                )}
                {type === 'datadog' && (
                  <div className="grid gap-4 px-content">
                    <LogDrainFormItem
                      type="password"
                      value="api_key"
                      label="API Key"
                      formControl={form.control}
                      description={
                        <>
                          The API Key obtained from the Datadog dashboard{' '}
                          <a
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm underline transition hover:text-foreground"
                            href="https://app.datadoghq.com/organization-settings/api-keys"
                          >
                            here
                          </a>
                        </>
                      }
                    />
                    <FormField_Shadcn_
                      name="region"
                      control={form.control}
                      render={({ field }) => (
                        <FormItemLayout
                          layout="horizontal"
                          label={'Region'}
                          description={
                            <p>
                              The Datadog region to send logs to. Read more about Datadog regions{' '}
                              <a
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-foreground transition"
                                href="https://docs.datadoghq.com/getting_started/site/#access-the-datadog-site"
                              >
                                here
                              </a>
                              .
                            </p>
                          }
                        >
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
                {type === 'loki' && (
                  <div className="grid gap-4 px-content">
                    <LogDrainFormItem
                      type="url"
                      value="url"
                      placeholder="https://my-logs-endpoint.grafana.net/loki/api/v1/push"
                      label="Loki URL"
                      formControl={form.control}
                      description="The Loki HTTP(S) endpoint to send events."
                    />
                    <LogDrainFormItem
                      value="username"
                      label="Username"
                      placeholder="123456789"
                      formControl={form.control}
                    />
                    <LogDrainFormItem
                      type="password"
                      value="password"
                      label="Password"
                      placeholder="glc_ABCD1234567890"
                      formControl={form.control}
                    />
                  </div>
                )}
                <FormMessage_Shadcn_ />
              </div>
            </form>
          </Form_Shadcn_>

          {/* This form needs to be outside the <Form_Shadcn_> */}
          {(type === 'webhook' || type === 'loki') && (
            <>
              <div className="border-t mt-4">
                <div className="px-content pt-2 pb-3 border-b bg-background-alternative-200">
                  <h2 className="text-sm">Custom Headers</h2>
                  <p className="text-xs text-foreground-lighter">
                    {getHeadersSectionDescription()}
                  </p>
                </div>
                <div className="divide-y">
                  {hasHeaders &&
                    Object.keys(headers || {})?.map((headerKey) => (
                      <div
                        className="flex text-sm px-content text-foreground items-center font-mono py-1.5 group"
                        key={headerKey}
                      >
                        <div className="w-full">{headerKey}</div>
                        <div className="w-full truncate" title={headers?.[headerKey]}>
                          {headers?.[headerKey]}
                        </div>
                        <Button
                          className="justify-self-end opacity-0 group-hover:opacity-100 w-7"
                          type="text"
                          title="Remove"
                          icon={<TrashIcon />}
                          onClick={() => removeHeader(headerKey)}
                        ></Button>
                      </div>
                    ))}
                </div>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  addHeader()
                }}
                className="flex border-t py-4 gap-4 items-center px-content"
              >
                <label className="sr-only" htmlFor="header-name">
                  Header name
                </label>
                <Input_Shadcn_
                  id="header-name"
                  type="text"
                  placeholder="x-header-name"
                  value={newCustomHeader.name}
                  onChange={(e) => setNewCustomHeader({ ...newCustomHeader, name: e.target.value })}
                />
                <label className="sr-only" htmlFor="header-value">
                  Header value
                </label>
                <Input_Shadcn_
                  id="header-value"
                  type="text"
                  placeholder="Header value"
                  value={newCustomHeader.value}
                  onChange={(e) =>
                    setNewCustomHeader({ ...newCustomHeader, value: e.target.value })
                  }
                />

                <Button htmlType="submit" type="outline">
                  Add
                </Button>
              </form>
            </>
          )}
        </SheetSection>

        <div className="mt-auto">
          <SheetSection className="border-t bg-background-alternative-200 mt-auto">
            <FormItemLayout
              isReactForm={false}
              layout="horizontal"
              label={
                <div className="flex flex-col gap-y-2 text-foreground-light">
                  Additional drain cost
                  <DocsButton
                    abbrev={false}
                    className="w-min"
                    href="https://supabase.com/docs/guides/platform/log-drains"
                  />
                </div>
              }
            >
              <ul className="text-right text-foreground-light">
                <li className="text-brand-link text-base" translate="no">
                  $60 per drain per month
                </li>
                <li translate="no">+ $0.20 per million events</li>
                <li translate="no">+ $0.09 per GB egress</li>
              </ul>
            </FormItemLayout>
          </SheetSection>

          <SheetFooter className="p-content !mt-0">
            <Button form={FORM_ID} loading={isLoading} htmlType="submit" type="primary">
              Save destination
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
