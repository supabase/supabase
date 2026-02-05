import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { Control, ControllerRenderProps } from 'react-hook-form'

import { DatePicker } from 'components/ui/DatePicker'
import {
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  WarningIcon,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  CUSTOM_EXPIRY_VALUE,
  EXPIRES_AT_OPTIONS,
  NON_EXPIRING_TOKEN_VALUE,
} from '../../AccessToken.constants'
import { type TokenFormValues } from '../../AccessToken.schemas'

interface BasicInfoProps {
  control: Control<TokenFormValues>
  expirationDate: string
  onCustomDateChange?: (date: { date: string } | undefined) => void
  onCustomExpiryChange?: (isCustom: boolean) => void
}

export const BasicInfo = ({
  control,
  expirationDate,
  onCustomDateChange,
  onCustomExpiryChange,
}: BasicInfoProps) => {
  const [customDate, setCustomDate] = useState<Date>()
  const [isCustomSelected, setIsCustomSelected] = useState(false)

  useEffect(() => {
    const isCustom = expirationDate === CUSTOM_EXPIRY_VALUE
    setIsCustomSelected(isCustom)
    onCustomExpiryChange?.(isCustom)
  }, [expirationDate, onCustomExpiryChange])

  const handleCustomDateChange = (date: Date | undefined) => {
    setCustomDate(date)
    if (date) {
      onCustomDateChange?.({ date: date.toISOString() })
    } else {
      onCustomDateChange?.(undefined)
    }
  }

  const handleExpiryChange = (
    value: string,
    field: ControllerRenderProps<TokenFormValues, 'expiresAt'>
  ) => {
    const isCustom = value === CUSTOM_EXPIRY_VALUE
    setIsCustomSelected(isCustom)
    onCustomExpiryChange?.(isCustom)
    field.onChange(value)
  }

  return (
    <div className="space-y-4 px-5 sm:px-6 py-6">
      <FormField_Shadcn_
        key="tokenName"
        name="tokenName"
        control={control}
        render={({ field }) => (
          <FormItemLayout name="tokenName" label="Name">
            <FormControl_Shadcn_>
              <Input_Shadcn_
                id="tokenName"
                {...field}
                placeholder="Provide a name for your token"
              />
            </FormControl_Shadcn_>
          </FormItemLayout>
        )}
      />

      <FormField_Shadcn_
        key="expiresAt"
        name="expiresAt"
        control={control}
        render={({ field }) => (
          <FormItemLayout name="expiresAt" label="Expires in">
            <div className="flex gap-2">
              <FormControl_Shadcn_ className="flex-grow">
                <Select_Shadcn_
                  value={field.value}
                  onValueChange={(value) => handleExpiryChange(value, field)}
                >
                  <SelectTrigger_Shadcn_>
                    <SelectValue_Shadcn_ placeholder="Expires at" />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {Object.values(EXPIRES_AT_OPTIONS).map(
                      (option: { value: string; label: string }) => (
                        <SelectItem_Shadcn_ key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem_Shadcn_>
                      )
                    )}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </FormControl_Shadcn_>
              {isCustomSelected && (
                <DatePicker
                  selectsRange={false}
                  triggerButtonSize="small"
                  contentSide="top"
                  minDate={new Date()}
                  maxDate={dayjs().add(1, 'year').toDate()}
                  onChange={(date) => {
                    const selectedDate = date.to || date.from
                    if (selectedDate) {
                      handleCustomDateChange(new Date(selectedDate))
                    } else {
                      handleCustomDateChange(undefined)
                    }
                  }}
                >
                  {customDate ? `${dayjs(customDate).format('DD MMM, HH:mm')}` : 'Select date'}
                </DatePicker>
              )}
            </div>
            {field.value === NON_EXPIRING_TOKEN_VALUE && (
              <div className="w-full flex gap-x-2 items-center mt-3 mx-0.5">
                <WarningIcon />
                <span className="text-xs text-left text-foreground-lighter">
                  Make sure to keep your non-expiring token safe and secure.
                </span>
              </div>
            )}
          </FormItemLayout>
        )}
      />
    </div>
  )
}
