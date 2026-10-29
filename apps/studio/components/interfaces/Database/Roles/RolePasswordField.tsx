import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { FormControl, FormField } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { InlineLinkClassName } from '@/components/ui/InlineLink'
import { generateStrongPassword } from '@/lib/project'

interface RolePasswordFieldProps {
  /** Whether leaving the field empty is allowed. Defaults to true. */
  isOptional?: boolean
  layout?: 'horizontal' | 'vertical'
}

/**
 * Password field for a role form. Render it inside a `<Form>` whose values include a
 * `password` string, and only while the role can log in.
 */
export const RolePasswordField = ({
  isOptional = true,
  layout = 'horizontal',
}: RolePasswordFieldProps) => {
  const { control, setValue } = useFormContext<{ password: string }>()
  const [isPasswordGenerated, setIsPasswordGenerated] = useState(false)

  return (
    <FormField
      control={control}
      name="password"
      render={({ field }) => (
        <FormItemLayout
          layout={layout}
          label="Password"
          description={
            <>
              {isOptional &&
                `Optional. Without a password, the role can't log in using password authentication. `}
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
