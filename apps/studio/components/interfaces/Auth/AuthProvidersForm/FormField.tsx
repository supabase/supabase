import { format } from 'date-fns'
import { CalendarIcon, ExternalLink } from 'lucide-react'
import { useEffect } from 'react'
import { useFormContext, type Control } from 'react-hook-form'
import ReactMarkdown from 'react-markdown'
import {
  Button,
  Calendar,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormInputGroupInput,
  Input_Shadcn_,
  InputGroup,
  InputGroupAddon,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Separator,
  SheetSection,
  Switch,
  Textarea,
  useWatch_Shadcn_,
} from 'ui'
import { Input as DataInput } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import type { Enum } from './AuthProvidersForm.types'
import { Markdown } from '@/components/interfaces/Markdown'
import { BASE_PATH } from '@/lib/constants'

interface FormFieldProps {
  projectRef: string | undefined
  organizationSlug: string | undefined
  name: string
  properties: any
  control: Control
  hasAccess: boolean
  disabled?: boolean
  readOnly?: boolean
}

const FormField = ({
  projectRef,
  name,
  properties,
  organizationSlug,
  control,
  hasAccess,
  disabled: disabledProp,
  readOnly,
}: FormFieldProps) => {
  const { setValue } = useFormContext()
  const { description: originalDescription } = properties
  let description = originalDescription

  if (originalDescription && projectRef) {
    description = originalDescription.replace(
      /\(\.\.\/auth\/(.*?)\)/g,
      `(/project/${projectRef}/auth/$1)`
    )
  }

  const fieldValue = useWatch_Shadcn_({ control, name })
  if (!hasAccess) {
    const planMessage = organizationSlug
      ? `Only available on [Pro plan](/org/${organizationSlug}/billing?panel=subscriptionPlan) and above.`
      : ''
    description = originalDescription ? `${originalDescription} ${planMessage}` : planMessage
  }
  const disabled =
    disabledProp || (properties.type === 'boolean' ? !hasAccess && !fieldValue : !hasAccess)

  const showValue = useWatch_Shadcn_({
    control,
    name: properties.show?.key,
    disabled: properties.show == null,
  })

  useEffect(() => {
    if (properties.show?.key != null && !showValue && fieldValue !== '') {
      setValue(name, '', { shouldDirty: true })
    }
  }, [fieldValue, name, properties.show?.key, setValue, showValue])

  if (properties.show) {
    if (properties.show.matches) {
      if (!properties.show.matches.includes(showValue)) {
        return null
      }
    } else if (!showValue) {
      return null
    }
  }

  switch (properties.type) {
    case 'datetime':
      return (
        <>
          <SheetSection>
            <FormField_Shadcn_
              control={control}
              name={name}
              disabled={disabled || readOnly}
              render={({ field }) => (
                <FormItemLayout
                  layout="horizontal"
                  label={properties.title}
                  description={
                    description ? (
                      <ReactMarkdown unwrapDisallowed disallowedElements={['p']}>
                        {description}
                      </ReactMarkdown>
                    ) : null
                  }
                >
                  <FormControl_Shadcn_>
                    <Popover_Shadcn_>
                      <PopoverTrigger_Shadcn_ asChild>
                        <Button
                          type="outline"
                          className="w-full justify-start text-left font-normal px-3 py-4"
                          icon={<CalendarIcon className="h-4 w-4" />}
                          size="small"
                        >
                          {field.value ? format(new Date(field.value), 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger_Shadcn_>
                      <PopoverContent_Shadcn_ className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date?.toISOString())
                          }}
                          initialFocus
                        />
                      </PopoverContent_Shadcn_>
                    </Popover_Shadcn_>
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
          </SheetSection>
          <Separator className="w-full" />
        </>
      )

    case 'string':
      return (
        <>
          <SheetSection>
            <FormField_Shadcn_
              control={control}
              name={name}
              disabled={disabled}
              render={({ field }) => (
                <FormItemLayout
                  layout="horizontal"
                  label={properties.title}
                  description={
                    description ? (
                      <Markdown content={description} className="text-foreground-lighter" />
                    ) : null
                  }
                >
                  <FormControl_Shadcn_ className="col-span-6">
                    {properties.isSecret ? (
                      <DataInput
                        {...field}
                        id={name}
                        size="small"
                        copy
                        reveal
                        readOnly={readOnly}
                      />
                    ) : (
                      <Input_Shadcn_ {...field} id={name} readOnly={readOnly} />
                    )}
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
          </SheetSection>
          <Separator className="w-full" />
        </>
      )

    case 'multiline-string':
      return (
        <>
          <SheetSection>
            <FormField_Shadcn_
              control={control}
              name={name}
              disabled={disabled}
              render={({ field }) => (
                <FormItemLayout
                  layout="horizontal"
                  label={properties.title}
                  description={
                    description ? (
                      <Markdown content={description} className="text-foreground-lighter" />
                    ) : null
                  }
                >
                  <FormControl_Shadcn_ className="col-span-6">
                    <Textarea
                      {...field}
                      id={name}
                      rows={4}
                      placeholder="Enter multi-line text"
                      className="resize-none"
                      readOnly={readOnly}
                    />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
          </SheetSection>
          <Separator className="w-full" />
        </>
      )

    case 'number':
      return (
        <>
          <SheetSection>
            <FormField_Shadcn_
              control={control}
              name={name}
              disabled={disabled}
              render={({ field }) => (
                <FormItemLayout
                  layout="horizontal"
                  label={properties.title}
                  description={
                    description ? (
                      <Markdown content={description} className="text-foreground-lighter" />
                    ) : null
                  }
                >
                  <FormControl_Shadcn_ className="col-span-6">
                    {properties.units ? (
                      <InputGroup>
                        <FormInputGroupInput
                          {...field}
                          id={name}
                          type="number"
                          onChange={(e) =>
                            field.onChange(e.target.value === '' ? '' : Number(e.target.value))
                          }
                          readOnly={readOnly}
                        />
                        <InputGroupAddon align="inline-end">
                          <ReactMarkdown unwrapDisallowed disallowedElements={['p']}>
                            {properties.units}
                          </ReactMarkdown>
                        </InputGroupAddon>
                      </InputGroup>
                    ) : (
                      <Input_Shadcn_
                        {...field}
                        id={name}
                        type="number"
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        readOnly={readOnly}
                      />
                    )}
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
          </SheetSection>
          <Separator className="w-full" />
        </>
      )

    case 'boolean':
      return (
        <>
          <SheetSection>
            <FormField_Shadcn_
              control={control}
              name={name}
              disabled={disabled || readOnly}
              render={({ field }) => (
                <FormItemLayout
                  layout="horizontal"
                  label={properties.title}
                  description={
                    <div className="flex flex-col gap-1">
                      {description ? <Markdown content={description} /> : null}
                      {properties.link && (
                        <span>
                          <Button asChild type="default" size="tiny" icon={<ExternalLink />}>
                            <a href={properties.link} target="_blank" rel="noreferrer noopener">
                              Documentation
                            </a>
                          </Button>
                        </span>
                      )}
                    </div>
                  }
                >
                  <FormControl_Shadcn_ className="col-span-6">
                    <Switch
                      id={name}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      size="small"
                    />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
          </SheetSection>
          <Separator className="w-full" />
        </>
      )

    case 'select':
      return (
        <>
          <SheetSection>
            <FormField_Shadcn_
              control={control}
              name={name}
              disabled={disabled || readOnly}
              render={({ field }) => (
                <FormItemLayout
                  layout="horizontal"
                  label={properties.title}
                  description={
                    description ? (
                      <div className="form-field-markdown">
                        <ReactMarkdown unwrapDisallowed disallowedElements={['p']}>
                          {description}
                        </ReactMarkdown>
                      </div>
                    ) : null
                  }
                >
                  <FormControl_Shadcn_ className="col-span-6">
                    <Select_Shadcn_
                      defaultValue={properties.enum[0]?.value}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger_Shadcn_>
                        <SelectValue_Shadcn_ placeholder="Select an option" />
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        {properties.enum.map((option: Enum) => (
                          <SelectItem_Shadcn_ key={option.value} value={option.value}>
                            <span className="flex gap-2 items-center">
                              {option.icon ? (
                                <img
                                  alt={`${option.label} icon`}
                                  className="h-6 w-6"
                                  src={`${BASE_PATH}/img/icons/${option.icon}`}
                                />
                              ) : null}
                              {option.label}
                            </span>
                          </SelectItem_Shadcn_>
                        ))}
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
          </SheetSection>
          <Separator className="w-full" />
        </>
      )

    default:
      return null
  }
}

export default FormField
