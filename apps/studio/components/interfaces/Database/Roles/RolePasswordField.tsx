import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { FormControl, FormField } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { InlineLinkClassName } from '@/components/ui/InlineLink'
import { generateStrongPassword } from '@/lib/project'

/**
 * Optional password field for a role form. Render it inside a `<Form>` whose values include
 * a `password` string, and only while the role can log in.
 */
export const RolePasswordField = () => {
  const { control, setValue } = useFormContext<{ password: string }>()
  const [isPasswordGenerated, setIsPasswordGenerated] = useState(false)

  return (
    <FormField
      control={control}
      name="password"
      render={({ field }) => (
        <FormItemLayout
          layout="horizontal"
          label="Password"
          description={
            <>
              Optional. Without a password, the role can't log in using password authentication.{' '}
              <button
                type="button"
                tabIndex={0}
                className={InlineLinkClassName}
                onClick={() => {
                  setValue('password', generateStrongPassword(), { shouldDirty: true })
                  setIsPasswordGenerated(true)
                }}
              >
                Generate a password
              </button>
              .
            </>
          }
        >
          <FormControl>
            <Input
              {...field}
              onChange={(event) => {
                field.onChange(event)
                setIsPasswordGenerated(false)
              }}
              copy={field.value.length > 0}
              type="password"
              autoComplete="new-password"
              placeholder="Type in a password"
            />
          </FormControl>
          <span role="status" aria-live="polite" className="sr-only">
            {isPasswordGenerated ? 'Password generated' : ''}
          </span>
        </FormItemLayout>
      )}
    />
  )
}
