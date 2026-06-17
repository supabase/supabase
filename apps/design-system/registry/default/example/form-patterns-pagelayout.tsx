import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ExternalLink, Trash, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  Calendar,
  Card,
  CardContent,
  CardFooter,
  Checkbox,
  Form,
  FormControl,
  FormField,
  FormInputGroupInput,
  FormInputGroupTextArea,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from 'ui'
import { Input as PasswordInput } from 'ui-patterns/DataInputs/Input'
import {
  DatePicker,
  DatePickerButton,
  DatePickerContent,
  DatePickerTrigger,
} from 'ui-patterns/DatePicker'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { KeyValueFieldArray } from 'ui-patterns/form/KeyValueFieldArray/KeyValueFieldArray'
import { getKeyValueFieldArrayValidationIssues } from 'ui-patterns/form/KeyValueFieldArray/validation'
import { SingleValueFieldArray } from 'ui-patterns/form/SingleValueFieldArray/SingleValueFieldArray'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import * as z from 'zod'

const formSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    maxConnections: z
      .union([
        z.literal(''),
        z.coerce
          .number()
          .gte(1000, 'Max connections should be at least 1000')
          .lte(10000, 'Max connections should not exceed 10000'),
      ])
      .refine((value) => value !== '', 'Max connections is required'),
    enableFeature: z.boolean(),
    enableRls: z.boolean(),
    enableNotifications: z.boolean(),
    enableAnalytics: z.boolean(),
    region: z.string().min(1, 'Region is required'),
    schemas: z.array(z.string()).min(1, 'At least one schema is required'),
    queueType: z.enum(['basic', 'partitioned']),
    expiryDate: z.date(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    duration: z
      .union([
        z.literal(''),
        z.coerce
          .number()
          .gte(1000, 'Duration should be at least 5ms')
          .lte(10000, 'Duration should not exceed 30ms'),
      ])
      .refine((value) => value !== '', 'Duration is required'),
    redirectUris: z.array(z.object({ value: z.string().url('Must be a valid URL') })),
    httpHeaders: z.array(z.object({ key: z.string().trim(), value: z.string().trim() })),
    apiKey: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    getKeyValueFieldArrayValidationIssues({
      rows: data.httpHeaders,
      keyFieldName: 'key',
      valueFieldName: 'value',
      keyRequiredMessage: 'Header name is required',
      valueRequiredMessage: 'Header value is required',
    }).forEach((issue) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: issue.message,
        path: ['httpHeaders', ...issue.path],
      })
    })
  })

const fakeApiKey = 'sk_live_51H3x4mpl3_4nd_53cur3_k3y_1234567890'

export default function FormPatternsPageLayout() {
  const uploadButtonRef = useRef<HTMLInputElement>(null)
  const fileUploadRef = useRef<HTMLInputElement>(null)
  const [logoFile, setLogoFile] = useState<File>()
  const [logoUrl, setLogoUrl] = useState<string>()
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      maxConnections: 10,
      enableFeature: false,
      enableRls: true,
      enableNotifications: false,
      enableAnalytics: true,
      region: '',
      schemas: ['public'],
      queueType: 'basic',
      expiryDate: undefined,
      password: '',
      duration: 10,
      redirectUris: [{ value: '' }],
      httpHeaders: [{ key: '', value: '' }],
      apiKey: fakeApiKey,
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <div className="w-full">
      <PageSection className="py-0">
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Form Settings</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                {/* Text Input */}
                <CardContent>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Text Input"
                        description="Single-line text entry for short values"
                      >
                        <FormControl>
                          <Input {...field} placeholder="Enter text" />
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>

                {/* Password Input */}
                <CardContent>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Password Input"
                        description="Masked input for secure text entry"
                      >
                        <FormControl>
                          <Input {...field} type="password" placeholder="Enter password" />
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>

                {/* Copyable Input */}
                <CardContent>
                  <FormField
                    control={form.control}
                    name="apiKey"
                    render={() => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Copyable Input"
                        description="Read-only input with copy-to-clipboard functionality"
                      >
                        <FormControl>
                          <PasswordInput
                            copy
                            readOnly
                            value={form.getValues('apiKey') || ''}
                            onChange={() => {}}
                            onCopy={() => console.log('Copied to clipboard')}
                          />
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>

                {/* Number Input */}
                <CardContent>
                  <FormField
                    control={form.control}
                    name="maxConnections"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Number Input"
                        description="Numeric input with min/max validation"
                      >
                        <FormControl>
                          <Input {...field} type="number" min={1} max={1000} />
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>

                {/* Input with Units */}
                <CardContent>
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Input with Units"
                        description="Input with additional unit label"
                      >
                        <FormControl>
                          <InputGroup>
                            <FormInputGroupInput {...field} type="number" min={5} max={30} />
                            <InputGroupAddon align="inline-end">
                              <InputGroupText className="font-mono">ms</InputGroupText>
                            </InputGroupAddon>
                          </InputGroup>
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>

                {/* Textarea */}
                <CardContent>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Textarea"
                        description="Multi-line text input for longer content"
                      >
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={4}
                            placeholder="Enter multi-line text"
                            className="resize-none"
                          />
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>

                {/* Textarea with addon */}
                <CardContent>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Textarea"
                        description="Multi-line text input for longer content with addon"
                      >
                        <FormControl>
                          <InputGroup>
                            <FormInputGroupTextArea
                              {...field}
                              rows={4}
                              placeholder="Enter multi-line text"
                              className="resize-none"
                            />
                            <InputGroupAddon align="block-end">
                              <InputGroupText>120 characters left</InputGroupText>
                            </InputGroupAddon>
                          </InputGroup>
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>

                {/* Icon Upload */}
                <CardContent>
                  <FormField
                    control={form.control}
                    name="description"
                    render={() => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Icon upload"
                        description="For icons, avatars, or small images with preview"
                      >
                        <FormControl>
                          <div className="flex gap-4 items-center">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => uploadButtonRef.current?.click()}
                              className="flex items-center justify-center h-10 w-10 shrink-0 overflow-hidden rounded-full"
                              style={{
                                backgroundImage: logoUrl ? `url("${logoUrl}")` : 'none',
                              }}
                            >
                              {!logoUrl && <Upload size={14} />}
                            </Button>
                            <div className="flex gap-2 items-center">
                              <Button
                                variant="default"
                                size="tiny"
                                icon={<Upload size={14} />}
                                onClick={() => uploadButtonRef.current?.click()}
                              >
                                Upload
                              </Button>
                              {logoUrl && (
                                <Button
                                  variant="default"
                                  size="tiny"
                                  icon={<Trash size={12} />}
                                  onClick={() => {
                                    setLogoFile(undefined)
                                    setLogoUrl(undefined)
                                  }}
                                />
                              )}
                            </div>
                            <input
                              type="file"
                              ref={uploadButtonRef}
                              className="hidden"
                              accept="image/png, image/jpeg"
                              onChange={(e) => {
                                const files = e.target.files
                                if (files && files.length > 0) {
                                  const file = files[0]
                                  setLogoFile(file)
                                  setLogoUrl(URL.createObjectURL(file))
                                  e.target.value = ''
                                }
                              }}
                            />
                          </div>
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>

                {/* File Upload */}
                <CardContent>
                  <FormField
                    control={form.control}
                    name="description"
                    render={() => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="File Upload"
                        description="Drag-and-drop or select files for upload"
                      >
                        <FormControl>
                          <div
                            className={`border-2 rounded-lg p-6 text-center bg-muted transition-colors duration-300 ${
                              isDragging
                                ? 'border-strong border-dashed bg-muted'
                                : 'border-border border-dashed'
                            }`}
                            onDragOver={(e) => {
                              e.preventDefault()
                              setIsDragging(true)
                            }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={(e) => {
                              e.preventDefault()
                              setIsDragging(false)
                              const files = Array.from(e.dataTransfer.files)
                              setUploadedFiles((prev) => [...prev, ...files])
                            }}
                          >
                            <input
                              type="file"
                              ref={fileUploadRef}
                              className="hidden"
                              multiple
                              onChange={(e) => {
                                const files = e.target.files
                                if (files) {
                                  setUploadedFiles((prev) => [...prev, ...Array.from(files)])
                                }
                                e.target.value = ''
                              }}
                            />
                            <div className="flex flex-col items-center gap-y-2">
                              <Upload size={20} className="text-foreground-lighter" />
                              <p className="text-sm text-foreground-light">
                                {uploadedFiles.length > 0
                                  ? `${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''} selected`
                                  : 'Upload files'}
                              </p>
                              <p className="text-xs text-foreground-lighter">
                                Drag and drop or{' '}
                                <button
                                  type="button"
                                  onClick={() => fileUploadRef.current?.click()}
                                  className="underline cursor-pointer hover:text-foreground-light"
                                >
                                  select files
                                </button>{' '}
                                to upload
                              </p>
                              {uploadedFiles.length > 0 && (
                                <div className="mt-4 w-full space-y-2">
                                  {uploadedFiles.map((file, idx) => (
                                    <div
                                      key={`${file.name}-${idx}`}
                                      className="flex items-center justify-between gap-2 p-2 bg rounded-sm border"
                                    >
                                      <span className="text-sm text-foreground-light truncate flex-1">
                                        {file.name}
                                      </span>
                                      <Button
                                        variant="default"
                                        size="tiny"
                                        icon={<Trash size={12} />}
                                        onClick={() => {
                                          setUploadedFiles((prev) =>
                                            prev.filter((_, i) => i !== idx)
                                          )
                                        }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>

                {/* Switch */}
                <CardContent>
                  <FormField
                    control={form.control}
                    name="enableFeature"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Switch"
                        description="Toggle for boolean on/off states"
                      >
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>

                {/* Checkbox */}
                <CardContent>
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Checkbox"
                    description="Boolean values or multiple selections"
                  >
                    <div className="w-full flex flex-col gap-4">
                      <FormField
                        control={form.control}
                        name="enableRls"
                        render={({ field }) => (
                          <div className="flex items-center w-full justify-start space-x-2">
                            <FormControl>
                              <Checkbox
                                id="enable-rls"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <label
                              htmlFor="enable-rls"
                              className="text-sm text-foreground-light leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              Enable Row Level Security
                            </label>
                          </div>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="enableNotifications"
                        render={({ field }) => (
                          <div className="flex items-center w-full justify-start space-x-2">
                            <FormControl>
                              <Checkbox
                                id="enable-notifications"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <label
                              htmlFor="enable-notifications"
                              className="text-sm text-foreground-light leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              Enable email notifications
                            </label>
                          </div>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="enableAnalytics"
                        render={({ field }) => (
                          <div className="flex items-center w-full justify-start space-x-2">
                            <FormControl>
                              <Checkbox
                                id="enable-analytics"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <label
                              htmlFor="enable-analytics"
                              className="text-sm text-foreground-light leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              Enable analytics tracking
                            </label>
                          </div>
                        )}
                      />
                    </div>
                  </FormItemLayout>
                </CardContent>

                {/* Select */}
                <CardContent>
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Select (Dropdown)"
                        description="Single selection from a list of options"
                      >
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                              <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                              <SelectItem value="eu-west-1">EU West (Ireland)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>

                {/* Multi-Select */}
                <CardContent>
                  <FormField
                    control={form.control}
                    name="schemas"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Multi-Select"
                        description="Multiple selection from a list"
                      >
                        <MultiSelector
                          onValuesChange={field.onChange}
                          values={field.value}
                          size="small"
                        >
                          <MultiSelectorTrigger
                            mode="inline-combobox"
                            label="Select options..."
                            badgeLimit="wrap"
                            showIcon={false}
                            deletableBadge
                            className="w-full"
                          />
                          <MultiSelectorContent>
                            <MultiSelectorList>
                              <MultiSelectorItem value="public">public</MultiSelectorItem>
                              <MultiSelectorItem value="auth">auth</MultiSelectorItem>
                              <MultiSelectorItem value="storage">storage</MultiSelectorItem>
                            </MultiSelectorList>
                          </MultiSelectorContent>
                        </MultiSelector>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>

                {/* Radio Group */}
                <CardContent>
                  <FormField
                    control={form.control}
                    name="queueType"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Radio Group"
                        description="Single selection from multiple options"
                      >
                        <FormControl>
                          <RadioGroupStacked value={field.value} onValueChange={field.onChange}>
                            <RadioGroupStackedItem
                              value="basic"
                              label="Option 1"
                              description="First option description"
                            />
                            <RadioGroupStackedItem
                              value="partitioned"
                              label="Option 2"
                              description="Second option description"
                            />
                          </RadioGroupStacked>
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>

                {/* Date Picker */}
                <CardContent>
                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field, fieldState }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Date Picker"
                        description="Date selection with calendar popover"
                      >
                        <FormControl>
                          <DatePicker>
                            <DatePickerTrigger asChild>
                              <DatePickerButton block isInvalid={fieldState.invalid}>
                                {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                              </DatePickerButton>
                            </DatePickerTrigger>
                            <DatePickerContent>
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </DatePickerContent>
                          </DatePicker>
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>

                {/* Field Array */}
                <CardContent>
                  <FormField
                    control={form.control}
                    name="redirectUris"
                    render={() => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Field Array"
                        description="Dynamic list for adding/removing items"
                      >
                        <SingleValueFieldArray
                          control={form.control}
                          name="redirectUris"
                          valueFieldName="value"
                          createEmptyRow={() => ({ value: '' })}
                          placeholder="https://example.com/callback"
                          addLabel="Add redirect URI"
                          removeLabel="Remove redirect URI"
                        />
                      </FormItemLayout>
                    )}
                  />
                </CardContent>

                {/* Key/Value Field Array */}
                <CardContent>
                  <FormField
                    control={form.control}
                    name="httpHeaders"
                    render={() => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Key/Value Field Array"
                        description="Repeated text pairs for headers, parameters, and config entries"
                      >
                        <KeyValueFieldArray
                          control={form.control}
                          name="httpHeaders"
                          keyFieldName="key"
                          valueFieldName="value"
                          createEmptyRow={() => ({ key: '', value: '' })}
                          keyPlaceholder="Header name"
                          valuePlaceholder="Header value"
                          addLabel="Add header"
                          removeLabel="Remove header"
                        />
                      </FormItemLayout>
                    )}
                  />
                </CardContent>

                {/* Action Field */}
                <CardContent>
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Action Field"
                    description="Button or link for navigation or performable actions"
                  >
                    <div className="flex gap-2 items-center justify-end">
                      <Button
                        variant="default"
                        icon={<ExternalLink size={14} />}
                        onClick={() => console.log('Action performed')}
                      >
                        View documentation
                      </Button>
                      <Button variant="default" onClick={() => console.log('Reset action')}>
                        Reset API key
                      </Button>
                    </div>
                  </FormItemLayout>
                </CardContent>
                <CardFooter className="justify-end space-x-2">
                  {form.formState.isDirty && (
                    <Button variant="default" onClick={() => form.reset()}>
                      Cancel
                    </Button>
                  )}
                  <Button variant="primary" type="submit" disabled={!form.formState.isDirty}>
                    Save changes
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </PageSectionContent>
      </PageSection>
    </div>
  )
}
