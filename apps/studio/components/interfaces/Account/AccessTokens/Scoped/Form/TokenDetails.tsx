import { format } from 'date-fns'
import type { UseFormReturn } from 'react-hook-form'
import {
  Badge,
  Calendar,
  FormControl,
  FormField,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
import {
  DatePicker,
  DatePickerButton,
  DatePickerContent,
  DatePickerTrigger,
} from 'ui-patterns/DatePicker'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import {
  EXPIRY_OPTIONS,
  getDefaultCustomExpiryDate,
  type TokenFormValues,
} from './NewScopedTokenForm.utils'

interface TokenDetailsProps {
  form: UseFormReturn<TokenFormValues>
}

export const TokenDetails = ({ form }: TokenDetailsProps) => {
  const handleExpiryChange = (value: string) => {
    form.setValue('expiresAt', value as TokenFormValues['expiresAt'], { shouldValidate: true })
    if (value === 'custom') {
      if (!form.getValues('customExpiryDate')) {
        const iso = getDefaultCustomExpiryDate()
        form.setValue('customExpiryDate', iso, { shouldValidate: true })
      }
    } else {
      form.setValue('customExpiryDate', undefined, { shouldValidate: true })
    }
  }

  return (
    <section className="space-y-4 px-5 sm:px-6 py-6">
      <h3 className="text-sm text-foreground">Token details</h3>

      <FormField
        key="tokenName"
        name="tokenName"
        control={form.control}
        render={({ field }) => (
          <FormItemLayout name="tokenName" label="Name">
            <FormControl>
              <Input id="tokenName" {...field} placeholder="e.g. CI deploy token" />
            </FormControl>
          </FormItemLayout>
        )}
      />

      <FormField
        key="expiresAt"
        name="expiresAt"
        control={form.control}
        render={({ field }) => (
          <FormItemLayout name="expiresAt" label="Expires in">
            <div className="flex gap-2">
              <FormControl className="grow">
                <Select value={field.value} onValueChange={handleExpiryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an expiry" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="flex items-center gap-2">
                          {option.label}
                          {option.recommended && <Badge variant="success">Recommended</Badge>}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>

              {field.value === 'custom' && (
                <FormField
                  key="customExpiryDate"
                  name="customExpiryDate"
                  control={form.control}
                  render={({ field, fieldState }) => {
                    const value = field.value ? new Date(field.value) : undefined
                    return (
                      <div className="w-1/2">
                        <DatePicker>
                          <DatePickerTrigger asChild>
                            <DatePickerButton ref={field.ref} block isInvalid={fieldState.invalid}>
                              {value ? format(value, 'dd MMM, yyyy') : 'Pick a date'}
                            </DatePickerButton>
                          </DatePickerTrigger>
                          <DatePickerContent>
                            <Calendar
                              mode="single"
                              selected={value}
                              onSelect={(date) => field.onChange(date?.toISOString())}
                              initialFocus
                            />
                          </DatePickerContent>
                        </DatePicker>
                        <FormMessage />
                      </div>
                    )
                  }}
                />
              )}
            </div>
          </FormItemLayout>
        )}
      />
    </section>
  )
}
