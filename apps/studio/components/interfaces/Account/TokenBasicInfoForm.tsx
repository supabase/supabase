import { Control } from 'react-hook-form'
import { FormField_Shadcn_, FormControl_Shadcn_, Input_Shadcn_, Select_Shadcn_, SelectTrigger_Shadcn_, SelectValue_Shadcn_, SelectContent_Shadcn_, SelectItem_Shadcn_ } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { getExpirationDateText } from './AccessToken.utils'
import { ACCESS_TOKEN_EXPIRY } from './AccessToken.constants'

interface TokenBasicInfoFormProps {
  control: Control<any>
  expirationDate: string
}

export const TokenBasicInfoForm = ({ control, expirationDate }: TokenBasicInfoFormProps) => {
  return (
    <div className="space-y-4">
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
    </div>
  )
} 