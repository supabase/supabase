import { Control } from 'react-hook-form'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import {
  FormField_Shadcn_,
  FormControl_Shadcn_,
  Select_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  Calendar,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Button,
  Input_Shadcn_,
  Input,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { getExpirationDateText } from './../AccessToken.utils'
import { ACCESS_TOKEN_EXPIRY } from './../AccessToken.constants'

interface TokenBasicInfoFormProps {
  control: Control<any>
  expirationDate: string
}

export const TokenBasicInfoForm = ({ control, expirationDate }: TokenBasicInfoFormProps) => {
  const [customDate, setCustomDate] = useState<Date>()
  const [isCustomSelected, setIsCustomSelected] = useState(false)

  // Initialize custom selection state based on current expiration date
  useEffect(() => {
    setIsCustomSelected(expirationDate === 'Custom')
  }, [expirationDate])

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
        key="expirationDate"
        name="expirationDate"
        control={control}
        render={({ field }) => (
          <FormItemLayout
            name="expirationDate"
            label="Expiration date"
            labelOptional={
              isCustomSelected && customDate
                ? `Token expires ${format(customDate, 'd MMM yyyy')}`
                : getExpirationDateText(expirationDate)
            }
          >
            <FormControl_Shadcn_>
              <Select_Shadcn_
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value)
                  setIsCustomSelected(value === 'Custom')
                }}
              >
                <SelectTrigger_Shadcn_>
                  <SelectValue_Shadcn_ placeholder="Select expiration date" />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  {ACCESS_TOKEN_EXPIRY.map((expiry) => (
                    <SelectItem_Shadcn_ key={expiry} value={expiry}>
                      {expiry}
                    </SelectItem_Shadcn_>
                  ))}
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </FormControl_Shadcn_>
          </FormItemLayout>
        )}
      />

      {isCustomSelected && (
        <FormField_Shadcn_
          key="customExpirationDate"
          name="customExpirationDate"
          control={control}
          render={({ field }) => (
            <Input
              layout="vertical"
              size="small"
              label="Custom expiration date"
              value={customDate ? format(customDate, 'd MMM yyyy') : ''}
              placeholder="Pick a date"
              actions={
                <Popover_Shadcn_>
                  <PopoverTrigger_Shadcn_ asChild>
                    <Button type="default" icon={<CalendarIcon />} className="px-1.5" />
                  </PopoverTrigger_Shadcn_>
                  <PopoverContent_Shadcn_ className="w-auto p-0" align="end" sideOffset={8}>
                    <Calendar
                      mode="single"
                      selected={customDate}
                      onSelect={(date) => {
                        setCustomDate(date)
                        field.onChange(date?.toISOString())
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent_Shadcn_>
                </Popover_Shadcn_>
              }
            />
          )}
        />
      )}
    </div>
  )
}
