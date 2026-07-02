import { useRef } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { FormControl, FormField } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { DATABASE_PASSWORD_REGEX } from './ProjectCreation.constants'
import { CreateProjectForm } from './ProjectCreation.schema'
import { SpecialSymbolsCallout } from './SpecialSymbolsCallout'
import Panel from '@/components/ui/Panel'
import { PasswordStrengthBar } from '@/components/ui/PasswordStrengthBar'
import { passwordStrength } from '@/lib/password-strength'
import { generateStrongPassword } from '@/lib/project'

interface DatabasePasswordInputProps {
  form: UseFormReturn<CreateProjectForm>
}

export const DatabasePasswordInput = ({ form }: DatabasePasswordInputProps) => {
  const passwordStrengthRequestIdRef = useRef(0)

  // [Refactor] DB Password could be a common component used in multiple pages with repeated logic
  const updatePasswordStrength = async (value: string) => {
    const requestId = passwordStrengthRequestIdRef.current + 1
    passwordStrengthRequestIdRef.current = requestId

    try {
      const { warning, message, strength } = await passwordStrength(value)

      if (requestId !== passwordStrengthRequestIdRef.current) return

      form.setValue('dbPassStrength', strength, { shouldValidate: false, shouldDirty: false })
      form.setValue('dbPassStrengthMessage', message ?? '', {
        shouldValidate: false,
        shouldDirty: false,
      })
      form.setValue('dbPassStrengthWarning', warning ?? '', {
        shouldValidate: false,
        shouldDirty: false,
      })

      form.trigger('dbPass')
    } catch (error) {
      if (requestId === passwordStrengthRequestIdRef.current) {
        console.error(error)
      }
    }
  }

  async function generatePassword() {
    const password = generateStrongPassword()
    form.setValue('dbPass', password)

    updatePasswordStrength(password)
  }

  return (
    <Panel.Content>
      <FormField
        control={form.control}
        name="dbPass"
        render={({ field }) => {
          const isInvalidDatabasePassword =
            field.value.length > 0 && !field.value.match(DATABASE_PASSWORD_REGEX)

          return (
            <FormItemLayout
              label="Database password"
              layout="horizontal"
              description={
                <>
                  {isInvalidDatabasePassword && <SpecialSymbolsCallout />}
                  <PasswordStrengthBar
                    passwordStrengthScore={form.getValues('dbPassStrength')}
                    password={field.value}
                    passwordStrengthMessage={form.getValues('dbPassStrengthMessage')}
                    generateStrongPassword={generatePassword}
                  />
                </>
              }
            >
              <FormControl>
                <Input
                  copy={field.value.length > 0}
                  type="password"
                  placeholder="Type in a strong password"
                  {...field}
                  autoComplete="off"
                  onChange={async (event) => {
                    const newValue = event.target.value
                    field.onChange(event)

                    updatePasswordStrength(newValue)
                  }}
                />
              </FormControl>
            </FormItemLayout>
          )
        }}
      />
    </Panel.Content>
  )
}
