import dayjs from 'dayjs'
import { useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import {
  Badge,
  FormControl,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { EXPIRY_OPTIONS, getDefaultCustomExpiryDate, type TokenFormValues } from './tokenForm'
import { DatePicker } from '@/components/ui/DatePicker'

interface TokenDetailsProps {
  form: UseFormReturn<TokenFormValues>
}

export const TokenDetails = ({ form }: TokenDetailsProps) => {
  const customExpiryDate = form.watch('customExpiryDate')
  const [customDateLabel, setCustomDateLabel] = useState<string | undefined>(
    customExpiryDate ? dayjs(customExpiryDate).format('DD MMM, YYYY') : undefined
  )

  const handleExpiryChange = (value: string) => {
    form.setValue('expiresAt', value as TokenFormValues['expiresAt'], { shouldValidate: true })
    if (value === 'custom') {
      if (!form.getValues('customExpiryDate')) {
        const iso = getDefaultCustomExpiryDate()
        form.setValue('customExpiryDate', iso, { shouldValidate: true })
        setCustomDateLabel(dayjs(iso).format('DD MMM, YYYY'))
      }
    } else {
      form.setValue('customExpiryDate', undefined, { shouldValidate: true })
      setCustomDateLabel(undefined)
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
                <DatePicker
                  selectsRange={false}
                  triggerButtonSize="small"
                  contentSide="top"
                  minDate={new Date()}
                  maxDate={dayjs().add(1, 'year').toDate()}
                  onChange={(date) => {
                    const selectedDate = date.to || date.from
                    if (selectedDate) {
                      const iso = new Date(selectedDate).toISOString()
                      form.setValue('customExpiryDate', iso, { shouldValidate: true })
                      setCustomDateLabel(dayjs(iso).format('DD MMM, YYYY'))
                    } else {
                      form.setValue('customExpiryDate', undefined, { shouldValidate: true })
                      setCustomDateLabel(undefined)
                    }
                  }}
                >
                  {customDateLabel ?? 'Select date'}
                </DatePicker>
              )}
            </div>
          </FormItemLayout>
        )}
      />
    </section>
  )
}
