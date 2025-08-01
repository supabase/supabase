
import { type Control } from 'react-hook-form'

import {
  FormField_Shadcn_,
  FormControl_Shadcn_,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { ACCESS_TOKEN_EXPIRY } from '../AccessToken.constants'

interface Step1BasicInfoProps {
  control: Control<any>
  getExpirationDateText: (expiryOption: string) => string
  expirationDate: string
}

const Step1BasicInfo = ({
  control,
  getExpirationDateText,
  expirationDate,
}: Step1BasicInfoProps) => {
  return (
    <>
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
            labelOptional={getExpirationDateText(expirationDate)}
          >
            <FormControl_Shadcn_>
              <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
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


    </>
  )
}

export default Step1BasicInfo 