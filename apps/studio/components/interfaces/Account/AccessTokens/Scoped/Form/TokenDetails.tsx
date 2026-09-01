import dayjs from 'dayjs'
import type { Control, UseFormSetValue } from 'react-hook-form'
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
  useWatch,
} from 'ui'
import {
  DatePicker,
  DatePickerButton,
  DatePickerContent,
  DatePickerTrigger,
} from 'ui-patterns/DatePicker'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { getMaxCustomExpiryDate } from '../../AccessToken.utils'
import {
  EXPIRY_OPTIONS,
  getDefaultCustomExpiryDate,
  type TokenFormValues,
} from './NewScopedTokenForm.utils'

interface TokenDetailsProps {
  control: Control<TokenFormValues>
  setValue: UseFormSetValue<TokenFormValues>
}

export const TokenDetails = ({ control, setValue }: TokenDetailsProps) => {
  const customExpiryDate = useWatch({ control, name: 'customExpiryDate' })
  const maxExpiryDate = getMaxCustomExpiryDate().toDate()

  const handleExpiryChange = (value: string) => {
    setValue('expiresAt', value as TokenFormValues['expiresAt'], { shouldValidate: true })
    if (value === 'custom') {
      if (!customExpiryDate) {
        const iso = getDefaultCustomExpiryDate()
        setValue('customExpiryDate', iso, { shouldValidate: true })
      }
    } else {
      setValue('customExpiryDate', undefined, { shouldValidate: true })
    }
  }

  return (
    <section className="space-y-4 px-5 sm:px-6 py-6">
      <h3 className="text-sm text-foreground sr-only">Token details</h3>

      <FormField
        key="tokenName"
        name="tokenName"
        control={control}
        render={({ field }) => (
          <FormItemLayout name="tokenName" label="Name" layout="flex-row-reverse">
            <FormControl>
              <Input {...field} placeholder="e.g. CI deploy token" />
            </FormControl>
          </FormItemLayout>
        )}
      />

      <FormField
        key="expiresAt"
        name="expiresAt"
        control={control}
        render={({ field }) => (
          <FormItemLayout id="expiresAt" label="Expires in" layout="flex-row-reverse">
            <div className="flex gap-2 w-full">
              <FormControl className="grow">
                <Select value={field.value} onValueChange={handleExpiryChange}>
                  <SelectTrigger id="expiresAt">
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
                  control={control}
                  render={({ field, fieldState }) => {
                    const value = field.value ? new Date(field.value) : undefined
                    return (
                      <div className="shrink">
                        <DatePicker>
                          <DatePickerTrigger asChild>
                            <DatePickerButton ref={field.ref} block isInvalid={fieldState.invalid}>
                              {value ? dayjs(value).format('DD MMM, YYYY') : 'Pick a date'}
                            </DatePickerButton>
                          </DatePickerTrigger>
                          <DatePickerContent align="end">
                            <Calendar
                              mode="single"
                              selected={value}
                              onSelect={(date) =>
                                field.onChange(
                                  date ? dayjs(date).endOf('day').toISOString() : undefined
                                )
                              }
                              initialFocus
                              startMonth={dayjs().startOf('month').toDate()}
                              endMonth={maxExpiryDate}
                              disabled={{
                                before: dayjs().startOf('day').toDate(),
                                after: maxExpiryDate,
                              }}
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
