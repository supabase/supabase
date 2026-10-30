import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { FormControl, FormField } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { InlineLinkClassName } from '@/components/ui/InlineLink'
import { generateStrongPassword } from '@/lib/project'

interface RolePasswordFieldProps {
  /** Whether the role already exists, so it may already have a password. Defaults to false. */
  isExistingRole?: boolean
}

/**
 * Optional password field for a role form. Render it inside a `<Form>` whose values include
 * a `password` string, and only while the role can log in.
 */
export const RolePasswordField = ({ isExistingRole = false }: RolePasswordFieldProps) => {
  const { control, setValue } = useFormContext<{ password: string }>()
  const [isPasswordGenerated, setIsPasswordGenerated] = useState(false)

  // A role without login can still hold a password, and leaving the field empty keeps it
  const hint = isExistingRole
    ? "Optional. Leave empty to keep the role's current password, if it has one."
    : "Optional. Without a password, the role can't log in using password authentication."

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
              {hint}{' '}
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
