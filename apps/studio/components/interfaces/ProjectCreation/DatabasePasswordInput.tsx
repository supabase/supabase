import { UseFormReturn } from 'react-hook-form'

import Panel from 'components/ui/Panel'
import PasswordStrengthBar from 'components/ui/PasswordStrengthBar'
import { passwordStrength } from 'lib/password-strength'
import { generateStrongPassword } from 'lib/project'
import { FormControl_Shadcn_, FormField_Shadcn_ } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { DATABASE_PASSWORD_REGEX } from './ProjectCreation.constants'
import { CreateProjectForm } from './ProjectCreation.schema'
import { SpecialSymbolsCallout } from './SpecialSymbolsCallout'

interface DatabasePasswordInputProps {
  form: UseFormReturn<CreateProjectForm>
  passwordStrengthMessage: string
  setPasswordStrengthMessage: (value: string) => void
  setPasswordStrengthWarning: (value: string) => void
}

export const DatabasePasswordInput = ({
  form,
  passwordStrengthMessage,
  setPasswordStrengthMessage,
  setPasswordStrengthWarning,
}: DatabasePasswordInputProps) => {
  async function checkPasswordStrength(value: any) {
    const { message, warning, strength } = await passwordStrength(value)

    form.setValue('dbPassStrength', strength)
    form.trigger('dbPassStrength')
    form.trigger('dbPass')

    setPasswordStrengthWarning(warning)
    setPasswordStrengthMessage(message)
  }

  // [Refactor] DB Password could be a common component used in multiple pages with repeated logic
  function generatePassword() {
    const password = generateStrongPassword()
    form.setValue('dbPass', password)
    checkPasswordStrength(password)
  }

  return (
    <Panel.Content>
      <FormField_Shadcn_
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
                    passwordStrengthMessage={passwordStrengthMessage}
                    generateStrongPassword={generatePassword}
                  />
                </>
              }
            >
              <FormControl_Shadcn_>
                <Input
                  copy={field.value.length > 0}
                  type="password"
                  placeholder="Type in a strong password"
                  {...field}
                  autoComplete="off"
                  onChange={async (event) => {
                    field.onChange(event)
                    form.trigger('dbPassStrength')
                    const value = event.target.value
                    if (event.target.value === '') {
                      await form.setValue('dbPassStrength', 0)
                      await form.trigger('dbPass')
                    } else {
                      await checkPasswordStrength(value)
                    }
                  }}
                />
              </FormControl_Shadcn_>
            </FormItemLayout>
          )
        }}
      />
    </Panel.Content>
  )
}
