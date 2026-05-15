import { zodResolver } from '@hookform/resolvers/zod'
import { IS_PLATFORM, useFlag, useParams } from 'common'
import Link from 'next/link'
import { ReactNode, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  cn,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
  TextArea_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { KeyValueFieldArray } from 'ui-patterns/form/KeyValueFieldArray/KeyValueFieldArray'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import { z } from 'zod'

import {
  DATADOG_REGIONS,
  LAST9_REGIONS,
  LOG_DRAIN_TYPES,
  LogDrainType,
  OTLP_PROTOCOLS,
} from './LogDrains.constants'
import {
  getDefaultHeadersByType,
  getHeadersSectionDescription as getHeadersDescription,
  headerRecordToRows,
  headerRowsToRecord,
  logDrainHeaderEntriesSchema,
  type LogDrainHeaderRow,
} from './LogDrains.utils'
import { TaxDisclaimer } from '@/components/interfaces/Billing/TaxDisclaimer'
import { LogDrainData, useLogDrainsQuery } from '@/data/log-drains/log-drains-query'
import { DOCS_URL } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'
import { httpEndpointUrlSchema } from '@/lib/validation/http-url'

const FORM_ID = 'log-drain-destination-form'

const headerRecordSchema = z.record(z.string(), z.string())

const webhookFields = {
  type: z.literal('webhook'),
  url: httpEndpointUrlSchema({
    requiredMessage: 'Endpoint URL is required',
    invalidMessage: 'Endpoint URL must be a valid URL',
    prefixMessage: 'Endpoint URL must start with http:// or https://',
  }),
  http: z.enum(['http1', 'http2']),
  gzip: z.boolean(),
}

const webhookFormSchema = z.object({
  ...webhookFields,
  headerEntries: logDrainHeaderEntriesSchema.optional(),
})

const webhookSubmitSchema = z.object({
  ...webhookFields,
  headers: headerRecordSchema.optional(),
})

const datadogSchema = z.object({
  type: z.literal('datadog'),
  api_key: z.string().min(1, { message: 'API key is required' }),
  region: z.string().min(1, { message: 'Region is required' }),
})

const lokiFields = {
  type: z.literal('loki'),
  url: httpEndpointUrlSchema({
    requiredMessage: 'Loki URL is required',
    invalidMessage: 'Loki URL must be a valid URL',
    prefixMessage: 'Loki URL must start with http:// or https://',
  }),
  username: z.string().optional(),
  password: z.string().optional(),
}

const lokiFormSchema = z.object({
  ...lokiFields,
  headerEntries: logDrainHeaderEntriesSchema.optional(),
})

const lokiSubmitSchema = z.object({
  ...lokiFields,
  headers: headerRecordSchema,
})

const elasticSchema = z.object({
  type: z.literal('elastic'),
})

const postgresSchema = z.object({
  type: z.literal('postgres'),
})

const bigquerySchema = z.object({
  type: z.literal('bigquery'),
})

const clickhouseSchema = z.object({
  type: z.literal('clickhouse'),
})

const s3Schema = z.object({
  type: z.literal('s3'),
  s3_bucket: z.string().min(1, { message: 'Bucket name is required' }),
  storage_region: z.string().min(1, { message: 'Region is required' }),
  access_key_id: z.string().min(1, { message: 'Access Key ID is required' }),
  secret_access_key: z.string().min(1, { message: 'Secret Access Key is required' }),
  batch_timeout: z.coerce
    .number()
    .int({ message: 'Batch timeout must be an integer' })
    .min(1, { message: 'Batch timeout must be a positive integer' }),
})

const sentrySchema = z.object({
  type: z.literal('sentry'),
  dsn: z
    .string()
    .min(1, { message: 'Sentry DSN is required' })
    .refine((dsn) => dsn.startsWith('https://'), 'Sentry DSN must start with https://'),
})

const axiomSchema = z.object({
  type: z.literal('axiom'),
  api_token: z.string().min(1, { message: 'API token is required' }),
  dataset_name: z.string().min(1, { message: 'Dataset name is required' }),
})

const last9Schema = z.object({
  type: z.literal('last9'),
  region: z.string().min(1, { message: 'Region is required' }),
  username: z.string().min(1, { message: 'Username is required' }),
  password: z.string().min(1, { message: 'Password is required' }),
})

const otlpFields = {
  type: z.literal('otlp'),
  endpoint: httpEndpointUrlSchema({
    requiredMessage: 'OTLP endpoint is required',
    invalidMessage: 'OTLP endpoint must be a valid URL',
    prefixMessage: 'OTLP endpoint must start with http:// or https://',
  }),
  protocol: z.string().optional().default('http/protobuf'),
  gzip: z.boolean().optional().default(true),
}

const otlpFormSchema = z.object({
  ...otlpFields,
  headerEntries: logDrainHeaderEntriesSchema.optional(),
})

const otlpSubmitSchema = z.object({
  ...otlpFields,
  headers: headerRecordSchema.optional(),
})

const syslogSchema = z.object({
  type: z.literal('syslog'),
  host: z.string().min(1, { message: 'Host is required' }),
  port: z.coerce
    .number()
    .int({ message: 'Port must be an integer' })
    .min(0, { message: 'Port must be between 0 and 65535' })
    .max(65535, { message: 'Port must be between 0 and 65535' }),
  tls: z.boolean().optional().default(false),
  structured_data: z.string().optional(),
  cipher_key: z.string().optional(),
  ca_cert: z.string().optional(),
  client_cert: z.string().optional(),
  client_key: z.string().optional(),
})

const formUnion = z.discriminatedUnion('type', [
  webhookFormSchema,
  datadogSchema,
  lokiFormSchema,
  // [Joshen] To fix API types, not supported in the UI
  elasticSchema,
  postgresSchema,
  bigquerySchema,
  clickhouseSchema,
  s3Schema,
  sentrySchema,
  axiomSchema,
  last9Schema,
  otlpFormSchema,
  syslogSchema,
])

const submitUnion = z.discriminatedUnion('type', [
  webhookSubmitSchema,
  datadogSchema,
  lokiSubmitSchema,
  elasticSchema,
  postgresSchema,
  bigquerySchema,
  clickhouseSchema,
  s3Schema,
  sentrySchema,
  axiomSchema,
  last9Schema,
  otlpSubmitSchema,
  syslogSchema,
])

const formSchema = z
  .object({
    name: z.string().min(1, {
      message: 'Destination name is required',
    }),
    description: z.string().optional(),
  })
  .and(formUnion)
  .superRefine((data, ctx) => {
    if (data.type !== 'syslog') return
    if (data.client_cert && !data.client_key) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Client key is required when a client certificate is provided',
        path: ['client_key'],
      })
    }
    if (data.client_key && !data.client_cert) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Client certificate is required when a client key is provided',
        path: ['client_cert'],
      })
    }
  })

const submitSchema = z
  .object({
    name: z.string().min(1, {
      message: 'Destination name is required',
    }),
    description: z.string().optional(),
  })
  .and(submitUnion)

type LogDrainDestinationFormValues = z.infer<typeof formSchema>
type LogDrainDestinationSubmitValues = z.infer<typeof submitSchema>

const HEADER_ENABLED_TYPES = ['webhook', 'loki', 'otlp'] as const

function toSubmitValues(values: LogDrainDestinationFormValues): LogDrainDestinationSubmitValues {
  if (!HEADER_ENABLED_TYPES.includes(values.type as (typeof HEADER_ENABLED_TYPES)[number])) {
    return submitSchema.parse(values)
  }

  const { headerEntries = [], ...rest } = values as LogDrainDestinationFormValues & {
    headerEntries?: LogDrainHeaderRow[]
  }
  const headers = headerRowsToRecord(headerEntries)
  const transformedValues =
    rest.type === 'loki'
      ? { ...rest, headers }
      : Object.keys(headers).length > 0
        ? { ...rest, headers }
        : rest

  return submitSchema.parse(transformedValues)
}

function LogDrainFormItem({
  value,
  label,
  description,
  formControl,
  placeholder,
  type,
}: {
  value: string
  label: string
  formControl: any
  placeholder?: string
  description?: ReactNode
  type?: string
}) {
  return (
    <FormField
      name={value}
      control={formControl}
      render={({ field }) => (
        <FormItemLayout layout="horizontal" label={label} description={description || ''}>
          <FormControl>
            <Input_Shadcn_ type={type || 'text'} placeholder={placeholder} {...field} />
          </FormControl>
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
  onSubmit: (values: LogDrainDestinationSubmitValues) => void
  mode: 'create' | 'update'
}) {
  // NOTE(kamil): This used to be `any` for a long long time, but after moving to Zod,
  // it produces a correct union type of all possible configs. Unfortunately, this type was not designed correctly
  // and it does not include `type` inside the config itself, so it's not trivial to create `discriminatedUnion`
  // out of it, therefore for an ease of use now, we bail to `any` until the better time come.
  const defaultType = defaultValues?.type || 'webhook'
  const defaultHeaderEntries = useMemo(() => {
    const config = (defaultValues?.config || {}) as any
    const type = defaultValues?.type || 'webhook'
    return headerRecordToRows(
      mode === 'create' ? getDefaultHeadersByType(type) : config?.headers || {}
    )
  }, [defaultValues, mode])

  const sentryEnabled = useFlag('SentryLogDrain')
  const s3Enabled = useFlag('S3logdrain')
  const axiomEnabled = useFlag('axiomLogDrain')
  const otlpEnabled = useFlag('otlpLogDrain')
  const last9Enabled = useFlag('Last9LogDrain')
  const syslogEnabled = useFlag('syslogLogDrain')

  const { ref } = useParams()
  const { data: logDrains } = useLogDrainsQuery({
    ref,
  })

  const track = useTrack()

  const formValues = useMemo(() => {
    const config = (defaultValues?.config || {}) as any
    const type = defaultValues?.type || 'webhook'
    return {
      name: defaultValues?.name || '',
      description: defaultValues?.description || '',
      type,
      http: config?.http || 'http2',
      gzip: mode === 'create' ? true : config?.gzip || false,
      headerEntries: defaultHeaderEntries,
      url: config?.url || '',
      api_key: config?.api_key || '',
      region: config?.region || '',
      username: config?.username || '',
      password: config?.password || '',
      dsn: config?.dsn || '',
      s3_bucket: config?.s3_bucket || '',
      storage_region: config?.storage_region || '',
      access_key_id: config?.access_key_id || '',
      secret_access_key: config?.secret_access_key || '',
      batch_timeout: config?.batch_timeout ?? 3000,
      dataset_name: config?.dataset_name || '',
      api_token: config?.api_token || '',
      endpoint: config?.endpoint || '',
      protocol: config?.protocol || 'http/protobuf',
      host: config?.host || '',
      port: (config?.port ?? '') as number,
      tls: config?.tls ?? false,
      structured_data: config?.structured_data || '',
      cipher_key: config?.cipher_key || '',
      ca_cert: config?.ca_cert || '',
      client_cert: config?.client_cert || '',
      client_key: config?.client_key || '',
    }
  }, [defaultValues, mode, defaultHeaderEntries])

  const form = useForm<LogDrainDestinationFormValues>({
    resolver: zodResolver(formSchema),
    values: formValues,
  })

  const type = form.watch('type')
  const tls = form.watch('tls')

  useEffect(() => {
    if (mode === 'create' && !open) {
      form.reset()
    }
  }, [mode, open, form])

  useEffect(() => {
    if (!open || mode !== 'create') return

    form.setValue('headerEntries', headerRecordToRows(getDefaultHeadersByType(type)))
    form.clearErrors('headerEntries')
  }, [form, mode, open, type])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        tabIndex={undefined}
        showClose={false}
        size="lg"
        className="overflow-y-auto flex flex-col"
      >
        <SheetHeader>
          <SheetTitle>Add destination</SheetTitle>
        </SheetHeader>
        <SheetSection className="px-0! pb-0!">
          <Form {...form}>
            <form
              id={FORM_ID}
              onSubmit={(e) => {
                e.preventDefault()

                // Temp check to make sure the name is unique
                const logDrainName = form.getValues('name')
                const logDrainExists =
                  !!logDrains?.length && logDrains?.find((drain) => drain.name === logDrainName)
                if (logDrainExists && mode === 'create') {
                  toast.error('Log drain name already exists')
                  return
                }

                form.handleSubmit((values) => onSubmit(toSubmitValues(values)))(e)
                track('log_drain_save_button_clicked', {
                  destination: form.getValues('type'),
                })
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
                  placeholder="Optional description"
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
                        {LOG_DRAIN_TYPES.filter((t) => {
                          if (t.value === 'sentry') return sentryEnabled
                          if (t.value === 's3') return s3Enabled
                          if (t.value === 'axiom') return axiomEnabled
                          if (t.value === 'otlp') return otlpEnabled
                          if (t.value === 'last9') return last9Enabled
                          if (t.value === 'syslog') return syslogEnabled
                          return true
                        }).map((type) => (
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
                      <FormField
                        control={form.control}
                        name="http"
                        render={({ field }) => (
                          <FormItemLayout layout="horizontal" label="HTTP Version">
                            <FormControl>
                              <RadioGroupCard
                                className="flex gap-2"
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormItem asChild>
                                  <FormControl>
                                    <RadioGroupCardItem value="http1" label="HTTP/1" />
                                  </FormControl>
                                </FormItem>
                                <FormItem asChild>
                                  <FormControl>
                                    <RadioGroupCardItem value="http2" label="HTTP/2" />
                                  </FormControl>
                                </FormItem>
                              </RadioGroupCard>
                            </FormControl>
                          </FormItemLayout>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="gzip"
                      render={({ field }) => (
                        <FormItem className="space-y-2 px-4">
                          <div className="flex gap-2 items-center">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="text-base">Gzip</FormLabel>
                            <InfoTooltip align="start">
                              Gzip compresses logs before sending it to the destination.
                            </InfoTooltip>
                          </div>
                        </FormItem>
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
                    <FormField
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
                          <FormControl>
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
                          </FormControl>
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
                {type === 'sentry' && (
                  <div className="grid gap-4 px-content">
                    <LogDrainFormItem
                      type="text"
                      value="dsn"
                      label="DSN"
                      placeholder="https://<project_id>@o<organization_id>.ingest.sentry.io/<project_id>"
                      formControl={form.control}
                      description={
                        <>
                          The DSN obtained from the Sentry dashboard. Read more about DSNs{' '}
                          <a
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm underline transition hover:text-foreground"
                            href="https://docs.sentry.io/concepts/key-terms/dsn-explainer/"
                          >
                            here
                          </a>
                          .
                        </>
                      }
                    />
                  </div>
                )}
                {type === 's3' && (
                  <div className="grid gap-4 px-content">
                    <LogDrainFormItem
                      value="s3_bucket"
                      label="S3 Bucket"
                      placeholder="my-log-bucket"
                      formControl={form.control}
                      description="The name of an existing S3 bucket."
                    />
                    <LogDrainFormItem
                      value="storage_region"
                      label="Region"
                      placeholder="us-east-1"
                      formControl={form.control}
                      description="AWS region where the bucket is located."
                    />
                    <LogDrainFormItem
                      value="access_key_id"
                      label="Access Key ID"
                      placeholder="AKIA..."
                      formControl={form.control}
                    />
                    <LogDrainFormItem
                      type="password"
                      value="secret_access_key"
                      label="Secret Access Key"
                      placeholder="••••••••••••••••"
                      formControl={form.control}
                    />
                    <LogDrainFormItem
                      type="number"
                      value="batch_timeout"
                      label="Batch Timeout (ms)"
                      placeholder="3000"
                      formControl={form.control}
                      description="Recommended 2000–5000ms."
                    />
                    <p className="text-xs text-foreground-lighter">
                      Ensure the account tied to the Access Key ID can write to the specified
                      bucket.
                    </p>
                  </div>
                )}
                {type === 'axiom' && (
                  <div className="grid gap-4 px-content">
                    <LogDrainFormItem
                      type="text"
                      value="dataset_name"
                      label="Dataset name"
                      placeholder="dataset"
                      formControl={form.control}
                      description="Name of the dataset in Axiom where the logs will be sent."
                    />
                    <LogDrainFormItem
                      type="text"
                      value="api_token"
                      label="API Token"
                      placeholder="xaat-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      formControl={form.control}
                      description="Token allowing ingest access to the specified dataset"
                    />
                  </div>
                )}
                {type === 'otlp' && (
                  <>
                    <div className="grid gap-4 px-content">
                      <LogDrainFormItem
                        type="url"
                        value="endpoint"
                        label="OTLP Endpoint"
                        placeholder="https://otlp.example.com:4318/v1/logs"
                        formControl={form.control}
                        description="The HTTP endpoint for OTLP log ingestion (typically ends with /v1/logs)"
                      />
                      <FormField
                        name="protocol"
                        control={form.control}
                        render={({ field }) => (
                          <FormItemLayout
                            layout="horizontal"
                            label="Protocol"
                            description="Only HTTP with Protocol Buffers is currently supported"
                          >
                            <FormControl>
                              <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger_Shadcn_ className="col-span-3">
                                  <SelectValue_Shadcn_ placeholder="Select protocol" />
                                </SelectTrigger_Shadcn_>
                                <SelectContent_Shadcn_>
                                  <SelectGroup_Shadcn_>
                                    <SelectLabel_Shadcn_>Protocol</SelectLabel_Shadcn_>
                                    {OTLP_PROTOCOLS.map((proto) => (
                                      <SelectItem_Shadcn_ key={proto.value} value={proto.value}>
                                        {proto.label}
                                      </SelectItem_Shadcn_>
                                    ))}
                                  </SelectGroup_Shadcn_>
                                </SelectContent_Shadcn_>
                              </Select_Shadcn_>
                            </FormControl>
                          </FormItemLayout>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="gzip"
                      render={({ field }) => (
                        <FormItem className="space-y-2 px-4">
                          <div className="flex gap-2 items-center">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="text-base">Gzip Compression</FormLabel>
                            <InfoTooltip align="start">
                              Enable gzip compression for log data sent to the OTLP endpoint.
                            </InfoTooltip>
                          </div>
                        </FormItem>
                      )}
                    />
                  </>
                )}
                {type === 'last9' && (
                  <div className="grid gap-4 px-content">
                    <FormField
                      name="region"
                      control={form.control}
                      render={({ field }) => (
                        <FormItemLayout
                          layout="horizontal"
                          label={'Region'}
                          description={
                            <p>
                              The Last9 region to send logs to. Credentials can be obtained from the
                              Last9 OTEL integration panel.
                            </p>
                          }
                        >
                          <FormControl>
                            <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger_Shadcn_ className="col-span-3">
                                <SelectValue_Shadcn_ placeholder="Select a region" />
                              </SelectTrigger_Shadcn_>
                              <SelectContent_Shadcn_>
                                <SelectGroup_Shadcn_>
                                  <SelectLabel_Shadcn_>Region</SelectLabel_Shadcn_>
                                  {LAST9_REGIONS.map((reg) => (
                                    <SelectItem_Shadcn_ key={reg.value} value={reg.value}>
                                      {reg.label}
                                    </SelectItem_Shadcn_>
                                  ))}
                                </SelectGroup_Shadcn_>
                              </SelectContent_Shadcn_>
                            </Select_Shadcn_>
                          </FormControl>
                        </FormItemLayout>
                      )}
                    />
                    <LogDrainFormItem
                      type="text"
                      value="username"
                      label="Username"
                      placeholder="username"
                      formControl={form.control}
                      description="Username for authentication from Last9 OTEL integration."
                    />
                    <LogDrainFormItem
                      type="password"
                      value="password"
                      label="Password"
                      placeholder="••••••••••••••••"
                      formControl={form.control}
                      description="Password for authentication from Last9 OTEL integration."
                    />
                  </div>
                )}
                {type === 'syslog' && (
                  <>
                    <div className="grid gap-4 px-content">
                      <LogDrainFormItem
                        value="host"
                        label="Host"
                        placeholder="logs.example.com"
                        formControl={form.control}
                        description="Hostname or IP address of the syslog receiver."
                      />
                      <LogDrainFormItem
                        type="number"
                        value="port"
                        label="Port"
                        placeholder="514"
                        formControl={form.control}
                        description="Port of the syslog receiver (0–65535)."
                      />
                      <LogDrainFormItem
                        value="structured_data"
                        label="Structured Data"
                        placeholder='[exampleSDID@32473 iut="3" eventSource="Application"]'
                        formControl={form.control}
                        description="Static RFC 5424 Structured Data included in every log frame."
                      />
                      <LogDrainFormItem
                        type="password"
                        value="cipher_key"
                        label="Cipher Key"
                        placeholder="••••••••••••••••"
                        formControl={form.control}
                        description="Base64-encoded 32-byte key for AES-256-GCM encryption of the log body."
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="tls"
                      render={({ field }) => (
                        <FormItem className="space-y-2 px-4">
                          <div className="flex gap-2 items-center">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="text-base">TLS</FormLabel>
                            <InfoTooltip align="start">
                              Connect via SSL/TLS instead of plain TCP.
                            </InfoTooltip>
                          </div>
                        </FormItem>
                      )}
                    />

                    {tls && (
                      <div className="grid gap-4 px-content">
                        <FormField
                          name="ca_cert"
                          control={form.control}
                          render={({ field }) => (
                            <FormItemLayout
                              layout="horizontal"
                              label="CA Certificate"
                              description="PEM encoded CA certificate for verifying the server. Falls back to the system CA bundle if omitted."
                            >
                              <FormControl>
                                <TextArea_Shadcn_
                                  className="font-mono text-xs"
                                  placeholder="-----BEGIN CERTIFICATE-----"
                                  rows={4}
                                  {...field}
                                />
                              </FormControl>
                            </FormItemLayout>
                          )}
                        />
                        <FormField
                          name="client_cert"
                          control={form.control}
                          render={({ field }) => (
                            <FormItemLayout
                              layout="horizontal"
                              label="Client Certificate"
                              description="PEM encoded client certificate for mTLS."
                            >
                              <FormControl>
                                <TextArea_Shadcn_
                                  className="font-mono text-xs"
                                  placeholder="-----BEGIN CERTIFICATE-----"
                                  rows={4}
                                  {...field}
                                />
                              </FormControl>
                            </FormItemLayout>
                          )}
                        />
                        <FormField
                          name="client_key"
                          control={form.control}
                          render={({ field }) => (
                            <FormItemLayout
                              layout="horizontal"
                              label="Client Key"
                              description="PEM encoded client private key for mTLS. Required when a client certificate is provided."
                            >
                              <FormControl>
                                <TextArea_Shadcn_
                                  className="font-mono text-xs"
                                  placeholder="-----BEGIN PRIVATE KEY-----"
                                  rows={4}
                                  {...field}
                                />
                              </FormControl>
                            </FormItemLayout>
                          )}
                        />
                      </div>
                    )}
                  </>
                )}
                {HEADER_ENABLED_TYPES.includes(type as (typeof HEADER_ENABLED_TYPES)[number]) && (
                  <div className="px-content">
                    <FormField
                      control={form.control}
                      name="headerEntries"
                      render={({ fieldState }) => (
                        <FormItemLayout
                          layout="horizontal"
                          label="Custom Headers"
                          description={getHeadersDescription(type)}
                          hideMessage={!fieldState.error?.message}
                        >
                          <KeyValueFieldArray
                            control={form.control}
                            name="headerEntries"
                            keyFieldName="key"
                            valueFieldName="value"
                            createEmptyRow={() => ({ key: '', value: '' })}
                            keyPlaceholder="Header name"
                            valuePlaceholder="Header value"
                            addLabel="Add a new header"
                            removeLabel="Remove header"
                          />
                        </FormItemLayout>
                      )}
                    />
                  </div>
                )}
              </div>
            </form>
          </Form>
        </SheetSection>

        <div className="mt-auto">
          <SheetSection
            className={cn(
              `border-t bg-background-alternative-200 mt-auto py-1.5 ${!IS_PLATFORM && 'hidden'}`
            )}
          >
            <ul className="text-right text-foreground-light divide-y divide-dashed text-sm">
              <li className="flex items-center justify-between gap-2 py-2" translate="no">
                <span className="text-foreground-lighter">Additional drain cost</span>
                <span className="text-foreground">$60 per month</span>
              </li>
              <li className="flex items-center justify-between gap-2 py-2" translate="no">
                <span className="text-foreground-lighter">Per million events</span>
                <span>+$0.20</span>
              </li>
              <li className="flex items-center justify-between gap-2 py-2" translate="no">
                <span className="text-foreground-lighter">Per GB egress</span>
                <span>+$0.09</span>
              </li>
            </ul>
          </SheetSection>

          <SheetFooter className="p-content mt-0! justify-between! flex-row! w-full items-center">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm text-foreground-light">
                <span>See full pricing breakdown</span>{' '}
                <Link
                  href={`${DOCS_URL}/guides/platform/manage-your-usage/log-drains`}
                  target="_blank"
                  className="text-foreground underline underline-offset-2 decoration-foreground-muted hover:decoration-foreground transition-all"
                >
                  here
                </Link>
              </span>
              <TaxDisclaimer />
            </div>
            <Button form={FORM_ID} loading={isLoading} htmlType="submit" type="primary">
              Save destination
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
