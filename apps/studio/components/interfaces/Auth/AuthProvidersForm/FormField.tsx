import dayjs from 'dayjs'
import { Eye, EyeOff, CalendarIcon } from 'lucide-react'
import { useState } from 'react'
import { BASE_PATH } from 'lib/constants'
import { format } from 'date-fns'
import { cn } from 'ui/src/lib/utils/cn'
import ReactMarkdown from 'react-markdown'
import {
  Button,
  Input_Shadcn_,
  Switch,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Popover_Shadcn_,
  PopoverTrigger_Shadcn_,
  PopoverContent_Shadcn_,
  Calendar,
  FormControl_Shadcn_,
  TextArea_Shadcn_,
} from 'ui'
import type { Enum } from './AuthProvidersForm.types'

interface FormFieldProps {
  field: any
  name: string
  properties: any
  disabled?: boolean
}

function formatDate(date: Date): string {
  return dayjs(date).format('dddd, MMMM D, YYYY HH:mm:ss Z')
}

const FormField = ({ field, name, properties, disabled = false }: FormFieldProps) => {
  const [hidden, setHidden] = useState(!!properties.isSecret)

  if (properties.show) {
    if (properties.show.matches) {
      if (!properties.show.matches.includes(properties.show.key)) {
        return null
      }
    } else if (!properties.show.key) {
      return null
    }
  }

  const renderMarkdown = (content?: string) => {
    if (!content) return null
    return (
      <ReactMarkdown
        className="text-foreground-light text-sm"
        unwrapDisallowed
        disallowedElements={['p']}
      >
        {content}
      </ReactMarkdown>
    )
  }

  switch (properties.type) {
    case 'datetime':
      return (
        <Popover_Shadcn_>
          <PopoverTrigger_Shadcn_ asChild>
            <FormControl_Shadcn_>
              <Button
                type="outline"
                className={cn(
                  'w-[240px] pl-3 text-left font-normal',
                  !field.value && 'text-foreground-light'
                )}
                disabled={disabled}
              >
                {field.value ? format(new Date(field.value), 'PPP') : <span>Pick a date</span>}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </FormControl_Shadcn_>
          </PopoverTrigger_Shadcn_>
          <PopoverContent_Shadcn_ className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={field.value ? new Date(field.value) : undefined}
              onSelect={(date: Date | undefined) => {
                if (date) {
                  // Set time to 24 hours from now
                  date.setHours(date.getHours() + 24)
                  field.onChange(date.toISOString())
                }
              }}
              disabled={(date: Date) => date < new Date()}
              initialFocus
            />
          </PopoverContent_Shadcn_>
        </Popover_Shadcn_>
      )

    case 'string':
      return (
        <div className="flex gap-2 flex-grow">
          <Input_Shadcn_
            {...field}
            type={hidden ? 'password' : 'text'}
            disabled={disabled}
            value={field.value ?? ''}
          />
          {properties.isSecret && (
            <Button
              type="default"
              onClick={() => setHidden(!hidden)}
              icon={hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            />
          )}
          {properties.units && (
            <span className="flex items-center text-foreground-light text-sm">
              {renderMarkdown(properties.units)}
            </span>
          )}
        </div>
      )

    case 'multiline-string':
      return (
        <div className="flex-grow">
          <TextArea_Shadcn_
            {...field}
            className="resize-y"
            rows={4}
            disabled={disabled}
            value={field.value ?? ''}
          />
          {properties.units && (
            <span className="flex items-center text-foreground-light text-sm mt-2">
              {renderMarkdown(properties.units)}
            </span>
          )}
        </div>
      )

    case 'number':
      return (
        <div className="flex gap-2 flex-grow">
          <Input_Shadcn_ {...field} type="number" disabled={disabled} value={field.value ?? ''} />
          {properties.units && (
            <span className="flex items-center text-foreground-light text-sm">
              {renderMarkdown(properties.units)}
            </span>
          )}
        </div>
      )

    case 'boolean':
      return (
        <Switch
          checked={field.value ?? false}
          onCheckedChange={field.onChange}
          disabled={disabled}
        />
      )

    case 'select':
      return (
        <Select_Shadcn_ value={field.value} onValueChange={field.onChange} disabled={disabled}>
          <SelectTrigger_Shadcn_>
            <SelectValue_Shadcn_ placeholder="Select an option" />
          </SelectTrigger_Shadcn_>
          <SelectContent_Shadcn_>
            {properties.enum?.map((option: Enum) => (
              <SelectItem_Shadcn_ key={option.value} value={option.value}>
                {option.label}
              </SelectItem_Shadcn_>
            ))}
          </SelectContent_Shadcn_>
        </Select_Shadcn_>
      )

    default:
      return <Input_Shadcn_ {...field} value={field.value ?? ''} disabled={disabled} />
  }
}

export default FormField
