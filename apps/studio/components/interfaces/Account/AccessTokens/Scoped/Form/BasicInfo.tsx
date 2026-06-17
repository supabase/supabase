import { Control } from 'react-hook-form'
import { FormControl, FormField, Input } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { type TokenFormValues } from '../../AccessToken.schemas'

interface BasicInfoProps {
  control: Control<TokenFormValues>
}

export const BasicInfo = ({ control }: BasicInfoProps) => {
  return (
    <div className="space-y-4 px-5 sm:px-6 py-6">
      <FormField
        key="tokenName"
        name="tokenName"
        control={control}
        render={({ field }) => (
          <FormItemLayout name="tokenName" label="Name">
            <FormControl>
              <Input id="tokenName" {...field} placeholder="My access token" />
            </FormControl>
            <p className="text-xs text-foreground-lighter mt-2">Give the token a name.</p>
          </FormItemLayout>
        )}
      />
    </div>
  )
}
