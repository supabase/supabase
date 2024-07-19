import { useParams } from 'common'
import {
  DATADOG_REGIONS,
  LOG_DRAIN_SOURCE_VALUES,
  LOG_DRAIN_SOURCES,
  LogDrainSource,
} from './LogDrains.constants'

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
  Label_Shadcn_,
} from 'ui'

import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { TrashIcon } from 'lucide-react'
import { LogDrainData } from 'data/log-drains/log-drains-query'
import Panel from 'components/ui/Panel'

const FORM_ID = 'log-drain-destination-form'

type SourceValue = (typeof LOG_DRAIN_SOURCE_VALUES)[number]

const formUnion = z.discriminatedUnion('source', [
  z.object({
    source: z.literal('webhook'),
    webhookUrl: z.string().url('Webhook URL is required and must be a valid URL'),
    httpVersion: z.enum(['HTTP1', 'HTTP2']),
    gzip: z.boolean(),
    customHeaders: z
      .array(
        z.object({
          name: z.string(),
          value: z.string(),
        })
      )
      .optional(),
  }),
  z.object({
    source: z.literal('datadog'),
    apiKey: z.string().min(1, { message: 'API key is required' }),
    region: z.string().min(1, { message: 'Region is required' }),
  }),
  z.object({
    source: z.literal('elasticfilebeat'),
    filebeatUrl: z.string().url({ message: 'URL is required and must be a valid URL' }),
    username: z.string().min(1, { message: 'Username is required' }),
    password: z.string().min(1, { message: 'Password is required' }),
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
}: {
  value: string
  label: string
  formControl: any
  placeholder?: string
  description?: string
  type?: string
}) {
  return (
    <FormField_Shadcn_
      name={value}
      control={formControl}
      render={({ field }) => (
        <FormItemLayout layout="horizontal" label={label} description={description || ''}>
          <FormControl_Shadcn_>
            <Input_Shadcn_ type={type || 'text'} placeholder={placeholder} {...field} />
          </FormControl_Shadcn_>
        </FormItemLayout>
      )}
    />
  )
}

export function LogDrainDestinationSheetForm({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  isLoading,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultValues?: Partial<LogDrainData>
  isLoading?: boolean
  onSubmit: (values: z.infer<typeof formSchema>) => void
}) {
  const { ref } = useParams() as { ref: string }
  const defaultSource = defaultValues?.source || 'webhook'

  const [newCustomHeader, setNewCustomHeader] = useState({ name: '', value: '' })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customHeaders: [],
      httpVersion: 'HTTP2',
      gzip: false,
      ...defaultValues,
    },
  })

  useEffect(() => {
    form.setValue('source', defaultSource)
  }, [defaultSource, form])

  const source = form.watch('source')
  const customHeaders = form.watch('customHeaders')

  function removeHeader(name: string) {
    form.setValue('customHeaders', customHeaders?.filter((header) => header.name !== name))
  }

  function addHeader() {
    if (form.getValues('customHeaders')?.length === 20) {
      toast.error('You can only have 20 custom headers')
      return
    }
    if (customHeaders?.find((header) => header.name === newCustomHeader.name)) {
      toast.error('Header name already exists')
      return
    }
    if (!newCustomHeader.name || !newCustomHeader.value) {
      toast.error('Header name and value are required')
      return
    }
    form.setValue('customHeaders', [...(customHeaders || []), newCustomHeader])
    setNewCustomHeader({ name: '', value: '' })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        form.reset()
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
                console.log({
                  form,
                  values: form.getValues(),
                  errors: form.formState.errors,
                })
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
                <LogDrainFormItem
                  value="description"
                  label="Description"
                  placeholder="Description of the destination"
                  formControl={form.control}
                />
                <RadioGroupStacked
                  value={source}
                  onValueChange={(v: SourceValue) => form.setValue('source', v)}
                >
                  {LOG_DRAIN_SOURCES.map((source) => (
                    <RadioGroupStackedItem
                      value={source.value}
                      key={source.value}
                      id={source.value}
                      label={source.name}
                      description={source.description}
                      className="text-left"
                    />
                  ))}
                </RadioGroupStacked>
              </div>

              <div className="space-y-4 mt-6">
                {source === 'webhook' && (
                  <>
                    <LogDrainFormItem
                      value="webhookUrl"
                      label="Webhook URL"
                      formControl={form.control}
                      placeholder="https://example.com/webhooks/log-drain"
                    />
                    <FormField_Shadcn_
                      control={form.control}
                      name="httpVersion"
                      render={({ field }) => (
                        <FormItem_Shadcn_>
                          <FormControl_Shadcn_>
                            <RadioGroupStacked
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormItem_Shadcn_ asChild>
                                <FormControl_Shadcn_>
                                  <RadioGroupStackedItem value="HTTP1" label="HTTP1" />
                                </FormControl_Shadcn_>
                              </FormItem_Shadcn_>
                              <FormItem_Shadcn_ asChild>
                                <FormControl_Shadcn_>
                                  <RadioGroupStackedItem value="HTTP2" label="HTTP2" />
                                </FormControl_Shadcn_>
                              </FormItem_Shadcn_>
                            </RadioGroupStacked>
                          </FormControl_Shadcn_>
                          <FormMessage_Shadcn_ />
                        </FormItem_Shadcn_>
                      )}
                    />

                    <FormField_Shadcn_
                      control={form.control}
                      name="gzip"
                      render={({ field }) => (
                        <FormItem_Shadcn_ className="flex gap-2 p-2 items-center">
                          <FormControl_Shadcn_>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl_Shadcn_>
                          <FormLabel_Shadcn_ className="text-base">Gzip</FormLabel_Shadcn_>
                        </FormItem_Shadcn_>
                      )}
                    />

                    <div>
                      <FormLabel_Shadcn_>Custom Headers</FormLabel_Shadcn_>
                      {customHeaders?.map((header) => (
                        <div
                          className="flex hover:bg-background-alternative text-sm text-foreground items-center font-mono border-b p-1.5 group"
                          key={header.name}
                        >
                          <div className="w-full px-1">{header.name}</div>
                          <div className="w-full px-1 truncate" title={header.value}>
                            {header.value}
                          </div>
                          <Button
                            className="justify-self-end opacity-0 group-hover:opacity-100"
                            type="text"
                            title="Remove"
                            icon={<TrashIcon />}
                            onClick={() => removeHeader(header.name)}
                          ></Button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {source === 'datadog' && (
                  <div className="grid gap-4">
                    <LogDrainFormItem
                      value="apiKey"
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
                {source === 'elasticfilebeat' && (
                  <div className="grid gap-4">
                    <LogDrainFormItem
                      value="filebeatUrl"
                      label="Filebeat URL"
                      formControl={form.control}
                    />
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
          {source === 'webhook' && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('test')
                addHeader()
              }}
              className="flex gap-2 mt-2 items-center"
            >
              <Input_Shadcn_
                size={'tiny'}
                type="text"
                placeholder="Header name"
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
