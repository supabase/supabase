import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon, Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import * as z from 'zod'

import {
  Button,
  Calendar,
  Card,
  CardContent,
  CardFooter,
  Checkbox_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  PrePostTab,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Switch,
  Textarea,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
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

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  maxConnections: z.number().min(1).max(1000),
  enableFeature: z.boolean(),
  enableRls: z.boolean(),
  enableNotifications: z.boolean(),
  enableAnalytics: z.boolean(),
  region: z.string().min(1, 'Region is required'),
  schemas: z.array(z.string()).min(1, 'At least one schema is required'),
  queueType: z.enum(['basic', 'partitioned']),
  expiryDate: z.date().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  duration: z.number().min(5).max(30),
  redirectUris: z.array(z.object({ value: z.string().url('Must be a valid URL') })),
})

export default function FormPatternsPageLayout() {
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
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'redirectUris',
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
          <Form_Shadcn_ {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  {/* Text Input */}
                  <FormField_Shadcn_
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Text Input"
                        description="Single-line text entry for short values"
                        className="[&>div]:md:w-1/2"
                      >
                        <FormControl_Shadcn_>
                          <Input_Shadcn_ {...field} placeholder="Enter text" />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />

                  {/* Password Input */}
                  <FormField_Shadcn_
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Password Input"
                        description="Masked input for secure text entry"
                        className="[&>div]:md:w-1/2"
                      >
                        <FormControl_Shadcn_>
                          <Input_Shadcn_ {...field} type="password" placeholder="Enter password" />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />

                  {/* Input with Units */}
                  <FormField_Shadcn_
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Input with Units"
                        description="Input with additional unit label"
                        className="[&>div]:md:w-1/2"
                      >
                        <FormControl_Shadcn_>
                          <PrePostTab postTab="MB" className="w-full">
                            <Input_Shadcn_ {...field} type="number" min={5} max={30} />
                          </PrePostTab>
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />

                  {/* Textarea */}
                  <FormField_Shadcn_
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Textarea"
                        description="Multi-line text input for longer content"
                        className="[&>div]:md:w-1/2"
                      >
                        <FormControl_Shadcn_>
                          <Textarea
                            {...field}
                            rows={4}
                            placeholder="Enter multi-line text"
                            className="resize-none"
                          />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />

                  {/* Number Input */}
                  <FormField_Shadcn_
                    control={form.control}
                    name="maxConnections"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Number Input"
                        description="Numeric input with min/max validation"
                        className="[&>div]:md:w-1/2"
                      >
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            {...field}
                            type="number"
                            min={1}
                            max={1000}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />

                  {/* Switch */}
                  <FormField_Shadcn_
                    control={form.control}
                    name="enableFeature"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Switch"
                        description="Toggle for boolean on/off states"
                      >
                        <FormControl_Shadcn_>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />

                  {/* Checkbox */}
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Checkbox"
                    description="Boolean values or multiple selections"
                    className="[&>div]:md:w-1/2"
                  >
                    <div className="w-full flex flex-col gap-4">
                      <FormField_Shadcn_
                        control={form.control}
                        name="enableRls"
                        render={({ field }) => (
                          <div className="flex items-center w-full justify-start space-x-2">
                            <FormControl_Shadcn_>
                              <Checkbox_Shadcn_
                                id="enable-rls"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl_Shadcn_>
                            <label
                              htmlFor="enable-rls"
                              className="text-sm text-foreground-light leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              Enable Row Level Security
                            </label>
                          </div>
                        )}
                      />
                      <FormField_Shadcn_
                        control={form.control}
                        name="enableNotifications"
                        render={({ field }) => (
                          <div className="flex items-center w-full justify-start space-x-2">
                            <FormControl_Shadcn_>
                              <Checkbox_Shadcn_
                                id="enable-notifications"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl_Shadcn_>
                            <label
                              htmlFor="enable-notifications"
                              className="text-sm text-foreground-light leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              Enable email notifications
                            </label>
                          </div>
                        )}
                      />
                      <FormField_Shadcn_
                        control={form.control}
                        name="enableAnalytics"
                        render={({ field }) => (
                          <div className="flex items-center w-full justify-start space-x-2">
                            <FormControl_Shadcn_>
                              <Checkbox_Shadcn_
                                id="enable-analytics"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl_Shadcn_>
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

                  {/* Select */}
                  <FormField_Shadcn_
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Select (Dropdown)"
                        description="Single selection from a list of options"
                        className="[&>div]:md:w-1/2"
                      >
                        <FormControl_Shadcn_>
                          <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger_Shadcn_>
                              <SelectValue_Shadcn_ placeholder="Select an option" />
                            </SelectTrigger_Shadcn_>
                            <SelectContent_Shadcn_>
                              <SelectItem_Shadcn_ value="us-east-1">
                                US East (N. Virginia)
                              </SelectItem_Shadcn_>
                              <SelectItem_Shadcn_ value="us-west-2">
                                US West (Oregon)
                              </SelectItem_Shadcn_>
                              <SelectItem_Shadcn_ value="eu-west-1">
                                EU West (Ireland)
                              </SelectItem_Shadcn_>
                            </SelectContent_Shadcn_>
                          </Select_Shadcn_>
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />

                  {/* Multi-Select */}
                  <FormField_Shadcn_
                    control={form.control}
                    name="schemas"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Multi-Select"
                        description="Multiple selection from a list"
                        className="[&>div]:md:w-1/2 [&>div>div]:md:w-full"
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

                  {/* Radio Group */}
                  <FormField_Shadcn_
                    control={form.control}
                    name="queueType"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Radio Group"
                        description="Single selection from multiple options"
                        className="[&>div]:md:w-1/2"
                      >
                        <FormControl_Shadcn_>
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
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />

                  {/* Date Picker */}
                  <FormField_Shadcn_
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Date Picker"
                        description="Date selection with calendar popover"
                        className="[&>div]:md:w-1/2"
                      >
                        <FormControl_Shadcn_>
                          <Popover_Shadcn_>
                            <PopoverTrigger_Shadcn_ asChild>
                              <Button
                                type="outline"
                                className="w-full justify-start text-left font-normal px-3 py-4"
                                icon={<CalendarIcon className="h-4 w-4" />}
                              >
                                {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                              </Button>
                            </PopoverTrigger_Shadcn_>
                            <PopoverContent_Shadcn_ className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent_Shadcn_>
                          </Popover_Shadcn_>
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />

                  {/* Field Array */}
                  <FormField_Shadcn_
                    control={form.control}
                    name="redirectUris"
                    render={() => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Field Array"
                        description="Dynamic list for adding/removing items"
                        className="[&>div]:md:w-1/2"
                      >
                        <div className="space-y-2 w-full">
                          {fields.map((field, index) => (
                            <FormField_Shadcn_
                              key={field.id}
                              control={form.control}
                              name={`redirectUris.${index}.value`}
                              render={({ field: inputField }) => (
                                <div className="flex gap-2">
                                  <FormControl_Shadcn_>
                                    <Input_Shadcn_
                                      {...inputField}
                                      placeholder="https://example.com/callback"
                                    />
                                  </FormControl_Shadcn_>
                                  {fields.length > 1 && (
                                    <Button
                                      type="default"
                                      size="tiny"
                                      icon={<Trash2 size={12} />}
                                      onClick={() => remove(index)}
                                    />
                                  )}
                                </div>
                              )}
                            />
                          ))}
                          <Button
                            type="default"
                            icon={<Plus />}
                            onClick={() => append({ value: '' })}
                          >
                            Add redirect URI
                          </Button>
                        </div>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>
                <CardFooter className="justify-end space-x-2">
                  {form.formState.isDirty && (
                    <Button type="default" onClick={() => form.reset()}>
                      Cancel
                    </Button>
                  )}
                  <Button type="primary" htmlType="submit" disabled={!form.formState.isDirty}>
                    Save changes
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form_Shadcn_>
        </PageSectionContent>
      </PageSection>
    </div>
  )
}
